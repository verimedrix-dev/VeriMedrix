"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS, getAccessLevelDisplayName } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { UserRole, InvitationStatus } from "@prisma/client";
import { sendEmail, getTeamInvitationEmail } from "@/lib/email";
import crypto from "crypto";
import { createId } from "@paralleldrive/cuid2";
import { enforceUserLimit, checkUserLimitStatus } from "@/lib/subscription-limits";
import { createClient } from "@supabase/supabase-js";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Create Supabase admin client for user management
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin credentials not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase user with email auto-confirmed (for invitation flow)
 * This uses the admin API to bypass email confirmation requirement
 */
export async function createInvitedUser(email: string, password: string): Promise<{ userId: string }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm the email
  });

  if (error) {
    console.error("Failed to create Supabase user:", error);
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Failed to create user account");
  }

  return { userId: data.user.id };
}

/**
 * Get employees who are eligible for invitation (have email, no user account, no pending invitation)
 */
export async function getEligibleEmployees() {
  await requirePermission(PERMISSIONS.TEAM);
  const { practice } = await ensureUserAndPractice();

  if (!practice) return [];

  return await withDbConnection(() =>
    prisma.employee.findMany({
      where: {
        practiceId: practice.id,
        isActive: true,
        email: { not: null },
        userId: null, // No user account yet
        TeamInvitation: null, // No pending invitation
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        position: true,
      },
      orderBy: { fullName: "asc" },
    })
  );
}

/**
 * Get pending invitations for the practice
 */
export async function getPendingInvitations() {
  await requirePermission(PERMISSIONS.TEAM);
  const { practice } = await ensureUserAndPractice();

  if (!practice) return [];

  return await withDbConnection(() =>
    prisma.teamInvitation.findMany({
      where: {
        practiceId: practice.id,
        status: "PENDING",
      },
      include: {
        Employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
          },
        },
        InvitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  );
}

/**
 * Send a team invitation to an employee
 */
export async function sendTeamInvitation({
  employeeId,
  role,
}: {
  employeeId: string;
  role: UserRole;
}) {
  await requirePermission(PERMISSIONS.TEAM);
  const { user, practice } = await ensureUserAndPractice();

  if (!practice || !user) {
    throw new Error("Unauthorized");
  }

  // Check subscription user limits before sending invitation
  await enforceUserLimit(practice.id);

  // Validate role - can only invite ADMIN, STAFF, or VIEWER
  if (!["ADMIN", "STAFF", "VIEWER"].includes(role)) {
    throw new Error("Invalid role. Can only invite with Full Access, Intermediate Access, or Minimum Access.");
  }

  // Get the employee and validate
  const employee = await withDbConnection(() =>
    prisma.employee.findFirst({
      where: {
        id: employeeId,
        practiceId: practice.id,
        isActive: true,
        email: { not: null },
        userId: null,
      },
      include: {
        TeamInvitation: true,
      },
    })
  );

  if (!employee) {
    throw new Error("Employee not found or not eligible for invitation");
  }

  if (!employee.email) {
    throw new Error("Employee does not have an email address");
  }

  if (employee.TeamInvitation) {
    throw new Error("This employee already has a pending invitation");
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  // Create invitation
  const invitation = await withDbConnection(() =>
    prisma.teamInvitation.create({
      data: {
        practiceId: practice.id,
        employeeId: employee.id,
        email: employee.email!,
        role,
        token,
        expiresAt,
        invitedById: user.id,
      },
      include: {
        Employee: true,
      },
    })
  );

  // Send invitation email
  const inviteUrl = `${APP_URL}/accept-invitation?token=${token}`;
  const emailContent = getTeamInvitationEmail({
    employeeName: employee.fullName,
    practiceName: practice.name,
    inviterName: user.name,
    accessLevel: getAccessLevelDisplayName(role),
    inviteUrl,
    expiryDate: expiresAt.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  try {
    await sendEmail({
      to: employee.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    // If email fails, delete the invitation
    await withDbConnection(() =>
      prisma.teamInvitation.delete({ where: { id: invitation.id } })
    );
    throw new Error(`Failed to send invitation email: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  revalidatePath("/team");
  return invitation;
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string) {
  await requirePermission(PERMISSIONS.TEAM);
  const { practice } = await ensureUserAndPractice();

  if (!practice) {
    throw new Error("Unauthorized");
  }

  const invitation = await withDbConnection(() =>
    prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        practiceId: practice.id,
        status: "PENDING",
      },
    })
  );

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  await withDbConnection(() =>
    prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    })
  );

  revalidatePath("/team");
}

/**
 * Resend an invitation (regenerates token and sends new email)
 */
export async function resendInvitation(invitationId: string) {
  await requirePermission(PERMISSIONS.TEAM);
  const { user, practice } = await ensureUserAndPractice();

  if (!practice || !user) {
    throw new Error("Unauthorized");
  }

  const invitation = await withDbConnection(() =>
    prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        practiceId: practice.id,
        status: "PENDING",
      },
      include: {
        Employee: true,
      },
    })
  );

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Generate new token and expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await withDbConnection(() =>
    prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        token,
        expiresAt,
        invitedById: user.id,
      },
    })
  );

  // Send new invitation email
  const inviteUrl = `${APP_URL}/accept-invitation?token=${token}`;
  const emailContent = getTeamInvitationEmail({
    employeeName: invitation.Employee?.fullName || invitation.email,
    practiceName: practice.name,
    inviterName: user.name,
    accessLevel: getAccessLevelDisplayName(invitation.role),
    inviteUrl,
    expiryDate: expiresAt.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  await sendEmail({
    to: invitation.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  revalidatePath("/team");
}

/**
 * Validate an invitation token (for accept invitation page)
 */
export async function validateInvitation(token: string) {
  const invitation = await withDbConnection(() =>
    prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        Employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        Practice: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  );

  if (!invitation) {
    return { valid: false, error: "Invalid invitation link" };
  }

  if (invitation.status !== "PENDING") {
    return { valid: false, error: "This invitation has already been used or cancelled" };
  }

  if (new Date() > invitation.expiresAt) {
    return { valid: false, error: "This invitation has expired" };
  }

  return {
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      isLocum: false,
      employee: invitation.Employee ? {
        id: invitation.Employee.id,
        fullName: invitation.Employee.fullName,
        position: invitation.Employee.position,
      } : null,
      locum: null,
      person: invitation.Employee ? {
        fullName: invitation.Employee.fullName,
        position: invitation.Employee.position || "",
      } : null,
      practice: invitation.Practice,
    },
  };
}

/**
 * Accept an invitation and create user account
 * This is called after Supabase auth account is created
 *
 * Handles three scenarios:
 * 1. New employee user - creates User + UserPractice entry + links Employee
 * 2. Existing user (multi-practice) - adds UserPractice entry for new practice
 * 3. Locum user - creates User + UserPractice entry + links Locum
 */
export async function acceptInvitation(token: string, supabaseUserId: string) {
  const validation = await validateInvitation(token);

  if (!validation.valid || !validation.invitation) {
    throw new Error(validation.error || "Invalid invitation");
  }

  const invitation = await withDbConnection(() =>
    prisma.teamInvitation.findUnique({
      where: { token },
      include: { Employee: true },
    })
  );

  if (!invitation) {
    throw new Error("Invitation not found");
  }

  // Check user limit before accepting (practice may have downgraded)
  // We check against current users only, not pending, since this invitation is being accepted
  const limitStatus = await checkUserLimitStatus(invitation.practiceId);
  if (limitStatus.maxUsers !== null) {
    // For limit check on accept, only count current users (not pending invites including this one)
    if (limitStatus.currentCount >= limitStatus.maxUsers) {
      throw new Error(
        `This practice has reached its user limit (${limitStatus.maxUsers} users). ` +
        `Please contact the practice administrator to upgrade their subscription.`
      );
    }
  }

  // Check if user already exists (multi-practice scenario)
  const existingUser = await withDbConnection(() =>
    prisma.user.findUnique({
      where: { email: invitation.email },
      include: { UserPractices: true }
    })
  );

  if (existingUser) {
    // User exists - add them to this practice (multi-practice support)
    const result = await withDbConnection(() =>
      prisma.$transaction(async (tx) => {
        // Check if they already have access to this practice
        const existingAccess = existingUser.UserPractices.find(
          up => up.practiceId === invitation.practiceId
        );

        if (existingAccess) {
          throw new Error("You already have access to this practice");
        }

        // Create UserPractice entry for the new practice
        await tx.userPractice.create({
          data: {
            userId: existingUser.id,
            practiceId: invitation.practiceId,
            role: invitation.role,
            isOwner: false,
            invitedById: invitation.invitedById,
          }
        });

        // Link employee to existing user (if employee record exists)
        if (invitation.employeeId) {
          await tx.employee.update({
            where: { id: invitation.employeeId },
            data: { userId: existingUser.id },
          });
        }

        // Mark invitation as accepted
        await tx.teamInvitation.update({
          where: { id: invitation.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });

        // Switch to the new practice context
        await tx.user.update({
          where: { id: existingUser.id },
          data: { currentPracticeId: invitation.practiceId }
        });

        return existingUser;
      })
    );

    return result;
  }

  // New user - create User + UserPractice entry
  const result = await withDbConnection(() =>
    prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          id: createId(),
          email: invitation.email,
          name: invitation.Employee.fullName,
          practiceId: invitation.practiceId,
          currentPracticeId: invitation.practiceId,
          role: invitation.role,
          clerkId: supabaseUserId, // Storing Supabase ID in clerkId field
          updatedAt: new Date(),
        },
      });

      // Create UserPractice entry
      await tx.userPractice.create({
        data: {
          userId: newUser.id,
          practiceId: invitation.practiceId,
          role: invitation.role,
          isOwner: false,
          invitedById: invitation.invitedById,
        }
      });

      // Link employee to user (if employee record exists)
      if (invitation.employeeId) {
        await tx.employee.update({
          where: { id: invitation.employeeId },
          data: { userId: newUser.id },
        });
      }

      // Mark invitation as accepted
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      return newUser;
    })
  );

  return result;
}

/**
 * Change a team member's role
 */
export async function changeTeamMemberRole(userId: string, newRole: UserRole) {
  await requirePermission(PERMISSIONS.TEAM);
  const { user, practice } = await ensureUserAndPractice();

  if (!practice || !user) {
    throw new Error("Unauthorized");
  }

  // Cannot change own role
  if (userId === user.id) {
    throw new Error("You cannot change your own role");
  }

  // Validate role - can only assign ADMIN, STAFF, or VIEWER
  if (!["ADMIN", "STAFF", "VIEWER"].includes(newRole)) {
    throw new Error("Invalid role");
  }

  // Check UserPractice for the target user's role in this practice
  const userPractice = await withDbConnection(() =>
    prisma.userPractice.findFirst({
      where: {
        userId: userId,
        practiceId: practice.id,
      },
    })
  );

  if (!userPractice) {
    // Fallback to legacy check
    const targetUser = await withDbConnection(() =>
      prisma.user.findFirst({
        where: {
          id: userId,
          practiceId: practice.id,
        },
      })
    );

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Cannot change role of practice owner
    if (targetUser.role === "PRACTICE_OWNER" || targetUser.role === "SUPER_ADMIN") {
      throw new Error("Cannot change role of practice owner");
    }

    // Update legacy role
    await withDbConnection(() =>
      prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      })
    );
  } else {
    // Cannot change role of practice owner
    if (userPractice.isOwner || userPractice.role === "PRACTICE_OWNER") {
      throw new Error("Cannot change role of practice owner");
    }

    // Update role in UserPractice table (multi-practice support)
    await withDbConnection(() =>
      prisma.userPractice.update({
        where: { id: userPractice.id },
        data: { role: newRole },
      })
    );
  }

  revalidatePath("/team");
}

/**
 * Remove a team member (deactivate their account)
 */
export async function removeTeamMember(userId: string) {
  await requirePermission(PERMISSIONS.TEAM);
  const { user, practice } = await ensureUserAndPractice();

  if (!practice || !user) {
    throw new Error("Unauthorized");
  }

  // Cannot remove self
  if (userId === user.id) {
    throw new Error("You cannot remove yourself from the team");
  }

  const targetUser = await withDbConnection(() =>
    prisma.user.findFirst({
      where: {
        id: userId,
        practiceId: practice.id,
      },
    })
  );

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Cannot remove practice owner
  if (targetUser.role === "PRACTICE_OWNER" || targetUser.role === "SUPER_ADMIN") {
    throw new Error("Cannot remove practice owner");
  }

  await withDbConnection(() =>
    prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })
  );

  revalidatePath("/team");
}

/**
 * Reactivate a team member
 */
export async function reactivateTeamMember(userId: string) {
  await requirePermission(PERMISSIONS.TEAM);
  const { practice } = await ensureUserAndPractice();

  if (!practice) {
    throw new Error("Unauthorized");
  }

  const targetUser = await withDbConnection(() =>
    prisma.user.findFirst({
      where: {
        id: userId,
        practiceId: practice.id,
        isActive: false,
      },
    })
  );

  if (!targetUser) {
    throw new Error("User not found");
  }

  await withDbConnection(() =>
    prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    })
  );

  revalidatePath("/team");
}

/**
 * Permanently delete a team member (removes from database)
 * Only works for deactivated users to prevent accidental deletion
 */
export async function deleteTeamMember(userId: string) {
  await requirePermission(PERMISSIONS.TEAM);
  const { user, practice } = await ensureUserAndPractice();

  if (!practice || !user) {
    throw new Error("Unauthorized");
  }

  // Cannot delete self
  if (userId === user.id) {
    throw new Error("You cannot delete yourself");
  }

  const [targetUser, linkedEmployee] = await withDbConnection(() =>
    Promise.all([
      prisma.user.findFirst({
        where: {
          id: userId,
          practiceId: practice.id,
        },
      }),
      prisma.employee.findFirst({
        where: {
          userId: userId,
          practiceId: practice.id,
        },
      }),
    ])
  );

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Cannot delete practice owner
  if (targetUser.role === "PRACTICE_OWNER" || targetUser.role === "SUPER_ADMIN") {
    throw new Error("Cannot delete practice owner");
  }

  // Only allow deleting deactivated users (safety measure)
  if (targetUser.isActive) {
    throw new Error("Please deactivate the user first before deleting permanently");
  }

  // Delete in transaction
  // Team member = User (software access), Employee = the person with their work history
  // Deleting a team member only removes their login access, not the employee's data
  await withDbConnection(() =>
    prisma.$transaction(async (tx) => {
      // Unlink employee from user (employee keeps all their data, just loses login access)
      if (linkedEmployee) {
        await tx.employee.update({
          where: { id: linkedEmployee.id },
          data: { userId: null },
        });
      }

      // Delete any pending invitations for this email
      await tx.teamInvitation.deleteMany({
        where: {
          email: targetUser.email,
          practiceId: practice.id,
        },
      });

      // Delete the user (removes software access)
      await tx.user.delete({
        where: { id: userId },
      });
    })
  );

  // Also delete from Supabase if they have a clerkId (which stores Supabase ID)
  if (targetUser.clerkId) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.auth.admin.deleteUser(targetUser.clerkId);
    } catch (error) {
      console.error("Failed to delete Supabase user:", error);
      // Don't throw - the database record is already deleted
    }
  }

  revalidatePath("/team");
}

/**
 * Get all team members with their details
 */
export async function getTeamMembers() {
  await requirePermission(PERMISSIONS.TEAM);
  const { practice } = await ensureUserAndPractice();

  if (!practice) return [];

  return await withDbConnection(() =>
    prisma.user.findMany({
      where: { practiceId: practice.id },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    })
  );
}

/**
 * Get the user limit status for the current practice
 * Used to display limit information in the UI
 */
export async function getTeamLimitStatus() {
  await requirePermission(PERMISSIONS.TEAM);
  const { practice } = await ensureUserAndPractice();

  if (!practice) {
    throw new Error("Unauthorized");
  }

  return await checkUserLimitStatus(practice.id);
}

