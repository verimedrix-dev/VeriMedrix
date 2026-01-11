"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import { revalidatePath } from "next/cache";
import { recordTrialUsage } from "@/lib/actions/auth";
import type { SubscriptionTier } from "@prisma/client";

type OnboardingData = {
  practiceName: string;
  practiceNumber?: string;
  practicePhone?: string;
  practiceAddress?: string;
  province: string;
  subscriptionTier: "ESSENTIALS" | "PROFESSIONAL";
};

/**
 * Complete the onboarding process for a new practice
 * - Updates practice details including province
 * - Sets subscription tier
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
          province: data.province,
          subscriptionTier: data.subscriptionTier as SubscriptionTier,
          subscriptionStatus: "TRIAL",
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

      // 3. Record that this email has used a free trial
      await tx.usedTrialEmail.upsert({
        where: { email: user.email.toLowerCase() },
        update: {},
        create: { email: user.email.toLowerCase() },
      });
    })
  );

  revalidatePath("/dashboard");
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
    prisma.$transaction(async (tx) => {
      await tx.practice.update({
        where: { id: practice.id },
        data: {
          onboardingCompleted: true,
          trialEndsAt,
        },
      });

      // Record that this email has used a free trial
      await tx.usedTrialEmail.upsert({
        where: { email: user.email.toLowerCase() },
        update: {},
        create: { email: user.email.toLowerCase() },
      });
    })
  );

  revalidatePath("/dashboard");
}
