"use server";

import { SubscriptionTier } from "@prisma/client";
import { prisma, withDbConnection } from "@/lib/prisma";
import { SUBSCRIPTION_LIMITS } from "./subscription-config";

/**
 * Get the current active user count for a practice
 * Counts only active users (isActive = true)
 */
export async function getActiveUserCount(practiceId: string): Promise<number> {
  return await withDbConnection(() =>
    prisma.user.count({
      where: {
        practiceId,
        isActive: true,
      },
    })
  );
}

/**
 * Get the count of pending invitations for a practice
 */
export async function getPendingInvitationCount(practiceId: string): Promise<number> {
  return await withDbConnection(() =>
    prisma.teamInvitation.count({
      where: {
        practiceId,
        status: "PENDING",
      },
    })
  );
}

/**
 * Check if a practice has reached its user limit
 * Returns an object with limit status and details
 * Optimized: Parallel queries for all data
 */
export async function checkUserLimitStatus(practiceId: string): Promise<{
  isLimitReached: boolean;
  currentCount: number;
  pendingCount: number;
  maxUsers: number | null;
  tier: SubscriptionTier;
  tierDisplayName: string;
  remainingSlots: number | null;
  canInvite: boolean;
}> {
  // Fetch all data in parallel
  const [practice, currentCount, pendingCount] = await withDbConnection(() =>
    Promise.all([
      prisma.practice.findUnique({
        where: { id: practiceId },
        select: { subscriptionTier: true },
      }),
      prisma.user.count({
        where: { practiceId, isActive: true },
      }),
      prisma.teamInvitation.count({
        where: { practiceId, status: "PENDING" },
      }),
    ])
  );

  if (!practice) {
    throw new Error("Practice not found");
  }

  const tier = practice.subscriptionTier;
  const config = SUBSCRIPTION_LIMITS[tier];
  const maxUsers = config.maxUsers;

  // Total potential users = current + pending
  const totalPotential = currentCount + pendingCount;

  // If unlimited (null), never reached
  if (maxUsers === null) {
    return {
      isLimitReached: false,
      currentCount,
      pendingCount,
      maxUsers,
      tier,
      tierDisplayName: config.displayName,
      remainingSlots: null, // Unlimited
      canInvite: true,
    };
  }

  const remainingSlots = maxUsers - totalPotential;
  const isLimitReached = totalPotential >= maxUsers;

  return {
    isLimitReached,
    currentCount,
    pendingCount,
    maxUsers,
    tier,
    tierDisplayName: config.displayName,
    remainingSlots: Math.max(0, remainingSlots),
    canInvite: !isLimitReached,
  };
}

/**
 * Check if a practice can add more users
 * Throws an error if limit is reached (for use in server actions)
 */
export async function enforceUserLimit(practiceId: string): Promise<void> {
  const status = await checkUserLimitStatus(practiceId);

  if (status.isLimitReached) {
    throw new Error(
      `User limit reached. Your ${status.tierDisplayName} plan allows ${status.maxUsers} users. ` +
      `You currently have ${status.currentCount} active users and ${status.pendingCount} pending invitations. ` +
      `Please upgrade to Professional for unlimited users.`
    );
  }
}
