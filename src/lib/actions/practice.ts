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

import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-config";

/**
 * Get the next billing date (or set one if not exists)
 */
function getNextBillingDate(existingDate: Date | null): Date {
  if (existingDate && existingDate > new Date()) {
    return existingDate;
  }
  // Default to 30 days from now for demo purposes
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);
  return nextBilling;
}

/**
 * Update subscription tier with proper upgrade/downgrade logic:
 * - Upgrade (to PROFESSIONAL): Takes effect immediately, prorated charge
 * - Downgrade (to ESSENTIALS): Scheduled for next billing date
 */
export async function updateSubscriptionTier(tier: "ESSENTIALS" | "PROFESSIONAL"): Promise<{
  success: boolean;
  message: string;
  isImmediate: boolean;
  effectiveDate?: Date;
  chargeAmount?: number;
}> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Practice not found");

  // Get full practice data including scheduled changes
  const fullPractice = await prisma.practice.findUnique({
    where: { id: practice.id },
    select: {
      subscriptionTier: true,
      scheduledTierChange: true,
      scheduledTierChangeDate: true,
      nextBillingDate: true,
    },
  });

  if (!fullPractice) throw new Error("Practice not found");

  const currentTier = fullPractice.subscriptionTier;

  // No change needed
  if (tier === currentTier) {
    // If there's a scheduled change, cancel it
    if (fullPractice.scheduledTierChange) {
      await prisma.practice.update({
        where: { id: practice.id },
        data: {
          scheduledTierChange: null,
          scheduledTierChangeDate: null,
          updatedAt: new Date(),
        },
      });
      revalidatePath("/settings");
      return {
        success: true,
        message: "Scheduled tier change has been cancelled. You will remain on your current plan.",
        isImmediate: true,
      };
    }
    return {
      success: true,
      message: "You are already on this plan.",
      isImmediate: true,
    };
  }

  const currentPrice = SUBSCRIPTION_LIMITS[currentTier].price;
  const newPrice = SUBSCRIPTION_LIMITS[tier].price;
  const isUpgrade = newPrice > currentPrice;

  if (isUpgrade) {
    // UPGRADE: Apply immediately
    const priceDifference = newPrice - currentPrice;

    await prisma.practice.update({
      where: { id: practice.id },
      data: {
        subscriptionTier: tier,
        scheduledTierChange: null,
        scheduledTierChangeDate: null,
        nextBillingDate: getNextBillingDate(fullPractice.nextBillingDate),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Upgraded to ${SUBSCRIPTION_LIMITS[tier].displayName}! Prorated charge of R${priceDifference.toLocaleString()} applied. Full amount of R${newPrice.toLocaleString()} will be charged on your next billing date.`,
      isImmediate: true,
      chargeAmount: priceDifference,
    };
  } else {
    // DOWNGRADE: Schedule for next billing date
    const nextBillingDate = getNextBillingDate(fullPractice.nextBillingDate);

    await prisma.practice.update({
      where: { id: practice.id },
      data: {
        scheduledTierChange: tier,
        scheduledTierChangeDate: nextBillingDate,
        nextBillingDate: nextBillingDate,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/settings");

    return {
      success: true,
      message: `Downgrade to ${SUBSCRIPTION_LIMITS[tier].displayName} scheduled for ${nextBillingDate.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}. You will continue to have access to Professional features until then.`,
      isImmediate: false,
      effectiveDate: nextBillingDate,
    };
  }
}

/**
 * Cancel a scheduled downgrade
 */
export async function cancelScheduledTierChange(): Promise<void> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Practice not found");

  await prisma.practice.update({
    where: { id: practice.id },
    data: {
      scheduledTierChange: null,
      scheduledTierChangeDate: null,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/settings");
}

/**
 * Get subscription details including any scheduled changes
 */
export async function getSubscriptionDetails() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const fullPractice = await prisma.practice.findUnique({
    where: { id: practice.id },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      scheduledTierChange: true,
      scheduledTierChangeDate: true,
      nextBillingDate: true,
      trialEndsAt: true,
    },
  });

  if (!fullPractice) return null;

  return {
    ...fullPractice,
    currentPlan: SUBSCRIPTION_LIMITS[fullPractice.subscriptionTier],
    scheduledPlan: fullPractice.scheduledTierChange
      ? SUBSCRIPTION_LIMITS[fullPractice.scheduledTierChange]
      : null,
  };
}

// ==================== ACCOUNT DELETION ====================

import { sendAccountDeletedEmail } from "@/lib/email";

/**
 * Permanently delete the practice account immediately.
 * This action:
 * 1. Deletes all practice data (employees, documents, payroll, etc.)
 * 2. Deletes all users associated with the practice
 * 3. Deletes the practice itself
 * 4. Sends a confirmation email
 *
 * THIS ACTION IS IRREVERSIBLE.
 */
export async function deletePracticeAccount(confirmationText: string, reason?: string) {
  const { user, practice } = await ensureUserAndPractice();

  if (!practice) throw new Error("Practice not found");
  if (!user) throw new Error("User not found");

  // Only practice owner or super admin can delete the account
  if (user.role !== "PRACTICE_OWNER" && user.role !== "SUPER_ADMIN") {
    throw new Error("Only the practice owner can delete the account");
  }

  // Require explicit confirmation
  if (confirmationText !== practice.name) {
    throw new Error("Confirmation text does not match practice name");
  }

  // Store info for email before deletion
  const practiceEmail = practice.email;
  const practiceName = practice.name;
  const userName = user.name;

  // Log the deletion reason if provided
  if (reason) {
    console.log(`Account deletion reason for ${practiceName}: ${reason}`);
  }

  // Permanently delete all practice data
  await permanentlyDeletePractice(practice.id);

  // Send confirmation email
  try {
    await sendAccountDeletedEmail(practiceEmail, userName, practiceName);
  } catch (error) {
    console.error("Failed to send account deleted email:", error);
    // Don't fail if email fails - data is already deleted
  }

  console.log(`Practice account permanently deleted: ${practiceEmail} (was ID: ${practice.id})`);

  return { success: true };
}

/**
 * Permanently delete a single practice and all its data.
 */
async function permanentlyDeletePractice(practiceId: string) {
  // Use a longer timeout (2 minutes) for this large deletion operation
  await prisma.$transaction(
    async (tx) => {
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
    },
    {
      maxWait: 120000, // 2 minutes max wait to acquire connection
      timeout: 120000, // 2 minutes timeout for the transaction
    }
  );
}
