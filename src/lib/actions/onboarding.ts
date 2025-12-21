"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

type TeamMember = {
  fullName: string;
  email: string;
  position: string;
};

type OnboardingData = {
  practiceName: string;
  practiceNumber?: string;
  practicePhone?: string;
  practiceAddress?: string;
  practiceSize: string;
  teamMembers: TeamMember[];
};

/**
 * Complete the onboarding process for a new practice
 * - Updates practice details
 * - Creates employee records for team members
 * - Marks onboarding as complete
 */
export async function completeOnboarding(data: OnboardingData) {
  const { user, practice } = await ensureUserAndPractice();

  if (!user || !practice) {
    throw new Error("User or practice not found");
  }

  // Check if onboarding is already completed
  if (practice.onboardingCompleted) {
    throw new Error("Onboarding has already been completed");
  }

  // Calculate trial end date (14 days from now)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await withDbConnection(() =>
    prisma.$transaction(async (tx) => {
      // 1. Update practice details
      await tx.practice.update({
        where: { id: practice.id },
        data: {
          name: data.practiceName,
          practiceNumber: data.practiceNumber,
          phone: data.practicePhone,
          address: data.practiceAddress,
          practiceSize: data.practiceSize,
          onboardingCompleted: true,
          trialEndsAt,
        },
      });

      // 2. Update the user's name if it was set to email during auto-creation
      if (user.name === user.email.split("@")[0]) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            name: data.practiceName + " (Owner)",
          },
        });
      }

      // 3. Create employee records for team members
      for (const member of data.teamMembers) {
        await tx.employee.create({
          data: {
            id: createId(),
            practiceId: practice.id,
            fullName: member.fullName,
            email: member.email,
            position: member.position,
            isActive: true,
            updatedAt: new Date(),
          },
        });
      }
    })
  );

  revalidatePath("/dashboard");
  revalidatePath("/team");
  revalidatePath("/employees");
}

/**
 * Check if onboarding is completed for the current user's practice
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  const { practice } = await ensureUserAndPractice();
  return practice?.onboardingCompleted ?? false;
}

/**
 * Skip onboarding and mark as completed with minimal setup
 */
export async function skipOnboarding() {
  const { user, practice } = await ensureUserAndPractice();

  if (!user || !practice) {
    throw new Error("User or practice not found");
  }

  // Calculate trial end date (14 days from now)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await withDbConnection(() =>
    prisma.practice.update({
      where: { id: practice.id },
      data: {
        onboardingCompleted: true,
        trialEndsAt,
      },
    })
  );

  revalidatePath("/dashboard");
}
