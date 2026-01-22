"use server";

import { prisma } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { SubscriptionTier } from "@prisma/client";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-config";

/**
 * Get the current billing/subscription status for a practice
 */
export async function getBillingStatus() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const fullPractice = await prisma.practice.findUnique({
    where: { id: practice.id },
    select: {
      id: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      nextBillingDate: true,
      scheduledTierChange: true,
      scheduledTierChangeDate: true,
    },
  });

  if (!fullPractice) return null;

  return {
    tier: fullPractice.subscriptionTier,
    status: fullPractice.subscriptionStatus,
    trialEndsAt: fullPractice.trialEndsAt,
    nextBillingDate: fullPractice.nextBillingDate,
    scheduledTierChange: fullPractice.scheduledTierChange,
    scheduledTierChangeDate: fullPractice.scheduledTierChangeDate,
    currentPlan: SUBSCRIPTION_LIMITS[fullPractice.subscriptionTier],
  };
}

/**
 * Start a new subscription - placeholder for PayFast integration
 * TODO: Implement PayFast subscription initialization
 */
export async function startSubscription(tier: SubscriptionTier): Promise<{
  success: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) {
    return { success: false, error: "Practice not found" };
  }

  // TODO: Implement PayFast integration
  return {
    success: false,
    error: "Payment integration coming soon. Please contact support to activate your subscription.",
  };
}

/**
 * Upgrade subscription to a higher tier - placeholder for PayFast integration
 * TODO: Implement PayFast upgrade flow
 */
export async function upgradeSubscription(newTier: SubscriptionTier): Promise<{
  success: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) {
    return { success: false, error: "Practice not found" };
  }

  const fullPractice = await prisma.practice.findUnique({
    where: { id: practice.id },
  });

  if (!fullPractice) {
    return { success: false, error: "Practice not found" };
  }

  const currentPrice = SUBSCRIPTION_LIMITS[fullPractice.subscriptionTier].price;
  const newPrice = SUBSCRIPTION_LIMITS[newTier].price;

  if (newPrice <= currentPrice) {
    return { success: false, error: "Cannot upgrade to a lower tier. Use downgrade instead." };
  }

  // TODO: Implement PayFast upgrade integration
  return {
    success: false,
    error: "Payment integration coming soon. Please contact support to upgrade your subscription.",
  };
}

/**
 * Schedule a downgrade to a lower tier
 * The downgrade will take effect at the end of the current billing period
 */
export async function scheduleDowngrade(newTier: SubscriptionTier): Promise<{
  success: boolean;
  effectiveDate?: Date;
  error?: string;
}> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) {
    return { success: false, error: "Practice not found" };
  }

  const fullPractice = await prisma.practice.findUnique({
    where: { id: practice.id },
  });

  if (!fullPractice) {
    return { success: false, error: "Practice not found" };
  }

  const currentPrice = SUBSCRIPTION_LIMITS[fullPractice.subscriptionTier].price;
  const newPrice = SUBSCRIPTION_LIMITS[newTier].price;

  if (newPrice >= currentPrice) {
    return { success: false, error: "Cannot downgrade to a higher tier. Use upgrade instead." };
  }

  try {
    // Calculate next billing date if not set
    const nextBillingDate = fullPractice.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.practice.update({
      where: { id: practice.id },
      data: {
        scheduledTierChange: newTier,
        scheduledTierChangeDate: nextBillingDate,
      },
    });

    revalidatePath("/settings");

    return {
      success: true,
      effectiveDate: nextBillingDate,
    };
  } catch (error) {
    console.error("[scheduleDowngrade] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule downgrade",
    };
  }
}

/**
 * Cancel a scheduled downgrade
 */
export async function cancelScheduledDowngrade(): Promise<{
  success: boolean;
  error?: string;
}> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) {
    return { success: false, error: "Practice not found" };
  }

  try {
    await prisma.practice.update({
      where: { id: practice.id },
      data: {
        scheduledTierChange: null,
        scheduledTierChangeDate: null,
      },
    });

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("[cancelScheduledDowngrade] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel downgrade",
    };
  }
}

/**
 * Get payment history for the current practice
 */
export async function getPaymentHistory(limit = 10) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return prisma.paymentTransaction.findMany({
    where: { practiceId: practice.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      paidAt: true,
      description: true,
      createdAt: true,
    },
  });
}

/**
 * Apply scheduled tier change for a practice
 * This is payment-provider agnostic
 */
export async function applyScheduledTierChange(practiceId: string): Promise<{
  success: boolean;
  applied: boolean;
  newTier?: SubscriptionTier;
  error?: string;
}> {
  try {
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: {
        id: true,
        subscriptionTier: true,
        scheduledTierChange: true,
        scheduledTierChangeDate: true,
      },
    });

    if (!practice) {
      return { success: false, applied: false, error: "Practice not found" };
    }

    // Check if there's a scheduled change that should be applied
    if (!practice.scheduledTierChange || !practice.scheduledTierChangeDate) {
      return { success: true, applied: false };
    }

    // Only apply if the scheduled date has passed
    if (new Date() < practice.scheduledTierChangeDate) {
      return { success: true, applied: false };
    }

    const newTier = practice.scheduledTierChange;

    // Apply the tier change
    await prisma.practice.update({
      where: { id: practiceId },
      data: {
        subscriptionTier: newTier,
        scheduledTierChange: null,
        scheduledTierChangeDate: null,
      },
    });

    console.log(`[Billing] Applied scheduled tier change for practice ${practiceId}: ${practice.subscriptionTier} -> ${newTier}`);

    return {
      success: true,
      applied: true,
      newTier,
    };
  } catch (error) {
    console.error("[applyScheduledTierChange] Error:", error);
    return {
      success: false,
      applied: false,
      error: error instanceof Error ? error.message : "Failed to apply tier change",
    };
  }
}

/**
 * TEST MODE: Directly switch subscription tier without payment
 * This is for testing purposes only - remove before production with real payments
 */
export async function testSwitchPlan(newTier: SubscriptionTier): Promise<{
  success: boolean;
  error?: string;
}> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) {
    return { success: false, error: "Practice not found" };
  }

  try {
    await prisma.practice.update({
      where: { id: practice.id },
      data: {
        subscriptionTier: newTier,
        subscriptionStatus: "ACTIVE",
        scheduledTierChange: null,
        scheduledTierChangeDate: null,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[testSwitchPlan] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to switch plan",
    };
  }
}

/**
 * Process all pending scheduled tier changes
 * Called by cron job to apply any scheduled downgrades/upgrades that are due
 */
export async function processAllScheduledTierChanges(): Promise<{
  success: boolean;
  processed: number;
  applied: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processed = 0;
  let applied = 0;

  try {
    // Find all practices with scheduled tier changes that are due
    const practicesWithScheduledChanges = await prisma.practice.findMany({
      where: {
        scheduledTierChange: { not: null },
        scheduledTierChangeDate: { lte: new Date() },
      },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        scheduledTierChange: true,
      },
    });

    console.log(`[Billing Cron] Found ${practicesWithScheduledChanges.length} practices with pending tier changes`);

    for (const practice of practicesWithScheduledChanges) {
      processed++;
      const result = await applyScheduledTierChange(practice.id);

      if (result.applied) {
        applied++;
        console.log(`[Billing Cron] Applied tier change for ${practice.name}: ${practice.subscriptionTier} -> ${result.newTier}`);
      } else if (!result.success) {
        errors.push(`Practice ${practice.id}: ${result.error}`);
      }
    }

    return {
      success: true,
      processed,
      applied,
      errors,
    };
  } catch (error) {
    console.error("[processAllScheduledTierChanges] Error:", error);
    return {
      success: false,
      processed,
      applied,
      errors: [...errors, error instanceof Error ? error.message : "Unknown error"],
    };
  }
}
