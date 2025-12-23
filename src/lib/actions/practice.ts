"use server";

import { getAuthUser } from "@/lib/supabase/server";
import { prisma, withDbConnection } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { sendWelcomeEmail } from "@/lib/email";

// Cache the DB user lookup for the duration of the request
export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  return withDbConnection(() =>
    prisma.user.findUnique({
      where: { email: authUser.email! },
      include: { Practice: true }
    })
  );
});

// Cache the practice lookup
export const getCurrentPractice = cache(async () => {
  const user = await getCurrentUser();
  return user?.Practice || null;
});

// Optimized: Single query path for existing users (99% of requests)
export const ensureUserAndPractice = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/sign-in");
  }

  // Fast path - direct query with connection retry
  let dbUser = await withDbConnection(() =>
    prisma.user.findUnique({
      where: { email: authUser.email! },
      include: { Practice: true }
    })
  );

  if (dbUser) {
    return { user: dbUser, practice: dbUser.Practice };
  }

  // Slow path: New user creation (rare)
  try {
    const result = await withDbConnection(() =>
      prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { email: authUser.email! },
          include: { Practice: true }
        });

        if (existingUser) {
          return { user: existingUser, practice: existingUser.Practice };
        }

        const practice = await tx.practice.create({
          data: {
            id: createId(),
            name: "My Practice",
            email: authUser.email!,
            updatedAt: new Date()
          }
        });

        const newUser = await tx.user.create({
          data: {
            id: createId(),
            email: authUser.email!,
            name: authUser.email!.split("@")[0],
            practiceId: practice.id,
            role: "PRACTICE_OWNER",
            updatedAt: new Date(),
          },
          include: { Practice: true }
        });

        return { user: newUser, practice: newUser.Practice, isNewUser: true };
      })
    );

    // Send welcome email to new users (don't await to avoid blocking)
    if (result.isNewUser && result.user.email) {
      sendWelcomeEmail(
        result.user.email,
        result.user.name || result.user.email.split("@")[0],
        result.practice?.name
      ).catch((err) => console.error("Failed to send welcome email:", err));
    }

    return result;
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      dbUser = await withDbConnection(() =>
        prisma.user.findUnique({
          where: { email: authUser.email! },
          include: { Practice: true }
        })
      );
      if (dbUser) {
        return { user: dbUser, practice: dbUser.Practice };
      }
    }
    throw error;
  }
});

// ==================== PRACTICE SETTINGS ====================

export async function getPracticeSettings() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return prisma.practice.findUnique({
    where: { id: practice.id },
    select: {
      id: true,
      name: true,
      practiceNumber: true,
      address: true,
      phone: true,
      email: true,
    },
  });
}

export async function updatePracticeSettings(data: {
  name?: string;
  practiceNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Practice not found");

  await prisma.practice.update({
    where: { id: practice.id },
    data,
  });

  revalidatePath("/settings");
}

// ==================== PRACTICE DOCUMENTS ====================

export async function getPracticeDocuments() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return prisma.practiceDocument.findMany({
    where: { practiceId: practice.id },
    include: { User: { select: { name: true, email: true } } },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function uploadPracticeDocument(data: {
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Unauthorized");

  const doc = await prisma.practiceDocument.create({
    data: {
      practiceId: practice.id,
      uploadedBy: user.id,
      ...data,
    },
  });

  revalidatePath("/settings");
  return doc;
}

export async function deletePracticeDocument(documentId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const doc = await prisma.practiceDocument.findFirst({
    where: { id: documentId, practiceId: practice.id },
  });

  if (!doc) throw new Error("Document not found");

  await prisma.practiceDocument.delete({ where: { id: documentId } });
  revalidatePath("/settings");
}

export async function updatePracticeDocumentName(documentId: string, name: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const doc = await prisma.practiceDocument.findFirst({
    where: { id: documentId, practiceId: practice.id },
  });

  if (!doc) throw new Error("Document not found");

  await prisma.practiceDocument.update({ where: { id: documentId }, data: { name } });
  revalidatePath("/settings");
}

// ==================== SUBSCRIPTION ====================

export async function getSubscriptionInfo() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return prisma.practice.findUnique({
    where: { id: practice.id },
    select: {
      id: true,
      subscriptionTier: true,
    },
  });
}

export async function updateSubscriptionTier(tier: "ESSENTIALS" | "PROFESSIONAL") {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Practice not found");

  await prisma.practice.update({
    where: { id: practice.id },
    data: {
      subscriptionTier: tier,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

// ==================== ACCOUNT DELETION ====================

import { sendAccountDeletionEmail, sendAccountReactivatedEmail } from "@/lib/email";

/**
 * Schedule the practice account for deletion in 30 days.
 * This action:
 * 1. Cancels any active subscription (sets status to CANCELLED)
 * 2. Marks the account for deletion with a 30-day grace period
 * 3. Sends a confirmation email with reactivation instructions
 *
 * The actual deletion happens via a cron job after 30 days.
 * Users can reactivate their account during this grace period.
 */
export async function deletePracticeAccount(confirmationText: string, reason?: string) {
  const { user, practice } = await ensureUserAndPractice();

  if (!practice) throw new Error("Practice not found");
  if (!user) throw new Error("User not found");

  // Only practice owner can delete the account
  if (user.role !== "PRACTICE_OWNER") {
    throw new Error("Only the practice owner can delete the account");
  }

  // Require explicit confirmation
  if (confirmationText !== practice.name) {
    throw new Error("Confirmation text does not match practice name");
  }

  // Calculate deletion date (30 days from now)
  const now = new Date();
  const scheduledDeletionAt = new Date(now);
  scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

  // Update practice with deletion schedule
  await prisma.practice.update({
    where: { id: practice.id },
    data: {
      subscriptionStatus: "CANCELLED",
      deletedAt: now,
      scheduledDeletionAt,
      deletionReason: reason,
      updatedAt: now,
    },
  });

  // Deactivate all users in this practice so they can't log in
  await prisma.user.updateMany({
    where: { practiceId: practice.id },
    data: { isActive: false },
  });

  // Send confirmation email
  try {
    await sendAccountDeletionEmail(
      practice.email,
      user.name,
      practice.name,
      scheduledDeletionAt
    );
  } catch (error) {
    console.error("Failed to send account deletion email:", error);
    // Don't fail the deletion if email fails
  }

  console.log(`Practice account scheduled for deletion: ${practice.email} (ID: ${practice.id}) on ${scheduledDeletionAt.toISOString()}`);

  return { success: true, deletionDate: scheduledDeletionAt };
}

/**
 * Reactivate a practice account that was scheduled for deletion.
 * This action:
 * 1. Removes the deletion schedule
 * 2. Reactivates the subscription
 * 3. Reactivates all users
 * 4. Sends a confirmation email
 */
export async function reactivatePracticeAccount(practiceId: string, userEmail: string) {
  // Find the practice
  const practice = await prisma.practice.findUnique({
    where: { id: practiceId },
  });

  if (!practice) {
    throw new Error("Practice not found");
  }

  // Verify this practice is scheduled for deletion
  if (!practice.deletedAt || !practice.scheduledDeletionAt) {
    throw new Error("This account is not scheduled for deletion");
  }

  // Check if deletion date has passed
  if (new Date() > practice.scheduledDeletionAt) {
    throw new Error("The deletion grace period has expired. This account cannot be recovered.");
  }

  // Find the owner to send email
  const owner = await prisma.user.findFirst({
    where: {
      practiceId,
      email: userEmail,
    },
  });

  if (!owner) {
    throw new Error("User not found for this practice");
  }

  // Reactivate the practice
  await prisma.practice.update({
    where: { id: practiceId },
    data: {
      subscriptionStatus: "ACTIVE",
      deletedAt: null,
      scheduledDeletionAt: null,
      deletionReason: null,
      updatedAt: new Date(),
    },
  });

  // Reactivate all users
  await prisma.user.updateMany({
    where: { practiceId },
    data: { isActive: true },
  });

  // Send confirmation email
  try {
    await sendAccountReactivatedEmail(
      owner.email,
      owner.name,
      practice.name
    );
  } catch (error) {
    console.error("Failed to send account reactivated email:", error);
    // Don't fail if email fails
  }

  console.log(`Practice account reactivated: ${practice.email} (ID: ${practiceId})`);

  return { success: true };
}

/**
 * Permanently delete practice accounts that have passed their deletion date.
 * This should be called by a cron job daily.
 */
export async function permanentlyDeleteExpiredAccounts() {
  const now = new Date();

  // Find all practices scheduled for deletion that have passed their date
  const expiredPractices = await prisma.practice.findMany({
    where: {
      scheduledDeletionAt: {
        lte: now,
      },
      deletedAt: {
        not: null,
      },
    },
  });

  console.log(`Found ${expiredPractices.length} practices to permanently delete`);

  for (const practice of expiredPractices) {
    try {
      await permanentlyDeletePractice(practice.id);
      console.log(`Permanently deleted practice: ${practice.email} (ID: ${practice.id})`);
    } catch (error) {
      console.error(`Failed to delete practice ${practice.id}:`, error);
    }
  }

  return { deleted: expiredPractices.length };
}

/**
 * Permanently delete a single practice and all its data.
 * Internal function - should only be called after grace period.
 */
async function permanentlyDeletePractice(practiceId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Delete all team invitations
    await tx.teamInvitation.deleteMany({
      where: { practiceId },
    });

    // 2. Delete all payroll data
    await tx.payrollAuditLog.deleteMany({
      where: { PayrollRun: { practiceId } },
    });
    await tx.payrollAddition.deleteMany({
      where: { PayrollEntry: { PayrollRun: { practiceId } } },
    });
    await tx.payrollDeduction.deleteMany({
      where: { PayrollEntry: { PayrollRun: { practiceId } } },
    });
    await tx.payrollEntry.deleteMany({
      where: { PayrollRun: { practiceId } },
    });
    await tx.payrollRun.deleteMany({
      where: { practiceId },
    });

    // 3. Delete all employee-related data
    await tx.employeeYTD.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.employeeFringeBenefit.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.employeeDeduction.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.employeeTraining.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.professionalRegistration.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.kpiGoal.deleteMany({
      where: { review: { Employee: { practiceId } } },
    });
    await tx.kpiReview.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.warning.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.leaveRequest.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.employeeDocument.deleteMany({
      where: { Employee: { practiceId } },
    });
    await tx.employee.deleteMany({
      where: { practiceId },
    });

    // 4. Delete locums
    await tx.locum.deleteMany({
      where: { practiceId },
    });

    // 5. Delete training modules
    await tx.positionTrainingRequirement.deleteMany({
      where: { practiceId },
    });
    await tx.trainingModule.deleteMany({
      where: { practiceId },
    });

    // 6. Delete documents
    await tx.document.deleteMany({
      where: { practiceId },
    });

    // 7. Delete tasks
    await tx.task.deleteMany({
      where: { practiceId },
    });
    await tx.taskTemplate.deleteMany({
      where: { practiceId },
    });

    // 8. Delete alerts and audit logs
    await tx.alert.deleteMany({
      where: { practiceId },
    });
    await tx.auditLog.deleteMany({
      where: { practiceId },
    });

    // 9. Delete practice documents
    await tx.practiceDocument.deleteMany({
      where: { practiceId },
    });

    // 10. Delete all users associated with this practice
    await tx.user.deleteMany({
      where: { practiceId },
    });

    // 11. Finally, delete the practice itself
    await tx.practice.delete({
      where: { id: practiceId },
    });
  });
}
