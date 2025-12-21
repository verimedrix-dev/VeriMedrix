"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

// ============= PRACTICES MANAGEMENT =============

// Optimized: Get admin practices page data with Redis caching
export async function getAdminPracticesPageData() {
  await requireSuperAdmin();

  return getCachedData(
    cacheKeys.adminPractices(),
    async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [practices, stats, recentPractices] = await Promise.all([
        prisma.practice.findMany({
          include: {
            _count: {
              select: {
                User: true,
                Employee: true,
                Document: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        Promise.all([
          prisma.practice.count(),
          prisma.practice.count({ where: { subscriptionStatus: "ACTIVE" } }),
          prisma.practice.count({ where: { subscriptionStatus: "TRIAL" } }),
          prisma.user.count({ where: { isActive: true } }),
          prisma.practice.groupBy({
            by: ["subscriptionTier"],
            _count: true,
          }),
        ]),
        prisma.practice.findMany({
          where: { createdAt: { gte: thirtyDaysAgo } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            createdAt: true,
          },
        }),
      ]);

      const [totalPractices, activePractices, trialPractices, activeUsers, tierBreakdown] = stats;

      return {
        practices,
        stats: {
          totalPractices,
          activePractices,
          trialPractices,
          cancelledPractices: totalPractices - activePractices - trialPractices,
          activeUsers,
          tierBreakdown: tierBreakdown.reduce((acc, item) => {
            acc[item.subscriptionTier] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
        recentPractices,
      };
    },
    CACHE_DURATIONS.MEDIUM // 5 minutes
  );
}

export const getAdminPractices = cache(async (options?: {
  search?: string;
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
  limit?: number;
  offset?: number;
}) => {
  await requireSuperAdmin();

  const where: Record<string, unknown> = {};

  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { email: { contains: options.search, mode: "insensitive" } },
    ];
  }

  if (options?.tier) {
    where.subscriptionTier = options.tier;
  }

  if (options?.status) {
    where.subscriptionStatus = options.status;
  }

  const [practices, total] = await Promise.all([
    prisma.practice.findMany({
      where,
      include: {
        _count: {
          select: {
            User: true,
            Employee: true,
            Document: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.practice.count({ where }),
  ]);

  return { practices, total };
});

export const getAdminPracticeById = cache(async (id: string) => {
  const admin = await requireSuperAdmin();

  const practice = await prisma.practice.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          twoFactorEnabled: true,
        },
        orderBy: { role: "asc" },
      },
      _count: {
        select: {
          Employee: true,
          Document: true,
          Task: true,
          Alert: true,
        },
      },
    },
  });

  if (practice) {
    await logAdminAction(admin.id, "VIEW_PRACTICE", "Practice", id);
  }

  return practice;
});

export async function updatePracticeSubscription(
  practiceId: string,
  data: {
    tier?: SubscriptionTier;
    status?: SubscriptionStatus;
    trialEndsAt?: Date | null;
  }
) {
  const admin = await requireSuperAdmin();

  const practice = await prisma.practice.update({
    where: { id: practiceId },
    data: {
      subscriptionTier: data.tier,
      subscriptionStatus: data.status,
      trialEndsAt: data.trialEndsAt,
      updatedAt: new Date(),
    },
  });

  await logAdminAction(admin.id, "UPDATE_SUBSCRIPTION", "Practice", practiceId, practiceId, data);

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.adminPractices()),
    invalidateCache(cacheKeys.adminDashboard()),
  ]);

  revalidatePath("/admin/practices");
  revalidatePath(`/admin/practices/${practiceId}`);

  return practice;
}

export async function suspendPractice(practiceId: string, reason?: string) {
  const admin = await requireSuperAdmin();

  // Deactivate all users in the practice
  await prisma.user.updateMany({
    where: { practiceId },
    data: { isActive: false },
  });

  // Update practice status
  const practice = await prisma.practice.update({
    where: { id: practiceId },
    data: {
      subscriptionStatus: "CANCELLED",
      updatedAt: new Date(),
    },
  });

  await logAdminAction(admin.id, "SUSPEND_PRACTICE", "Practice", practiceId, practiceId, { reason });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.adminPractices()),
    invalidateCache(cacheKeys.adminDashboard()),
  ]);

  revalidatePath("/admin/practices");
  revalidatePath(`/admin/practices/${practiceId}`);

  return practice;
}

export async function activatePractice(practiceId: string) {
  const admin = await requireSuperAdmin();

  // Reactivate the practice owner
  await prisma.user.updateMany({
    where: { practiceId, role: "PRACTICE_OWNER" },
    data: { isActive: true },
  });

  // Update practice status
  const practice = await prisma.practice.update({
    where: { id: practiceId },
    data: {
      subscriptionStatus: "ACTIVE",
      updatedAt: new Date(),
    },
  });

  await logAdminAction(admin.id, "ACTIVATE_PRACTICE", "Practice", practiceId, practiceId);

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.adminPractices()),
    invalidateCache(cacheKeys.adminDashboard()),
  ]);

  revalidatePath("/admin/practices");
  revalidatePath(`/admin/practices/${practiceId}`);

  return practice;
}

// ============= ANALYTICS =============

export const getPlatformStats = cache(async () => {
  await requireSuperAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalPractices,
    activePractices,
    trialPractices,
    totalUsers,
    activeUsers,
    newPracticesThisMonth,
    newPracticesThisWeek,
    tierBreakdown,
  ] = await Promise.all([
    prisma.practice.count(),
    prisma.practice.count({ where: { subscriptionStatus: "ACTIVE" } }),
    prisma.practice.count({ where: { subscriptionStatus: "TRIAL" } }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.practice.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.practice.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.practice.groupBy({
      by: ["subscriptionTier"],
      _count: true,
    }),
  ]);

  return {
    totalPractices,
    activePractices,
    trialPractices,
    cancelledPractices: totalPractices - activePractices - trialPractices,
    totalUsers,
    activeUsers,
    newPracticesThisMonth,
    newPracticesThisWeek,
    tierBreakdown: tierBreakdown.reduce((acc, item) => {
      acc[item.subscriptionTier] = item._count;
      return acc;
    }, {} as Record<string, number>),
  };
});

export const getSignupTrend = cache(async (days: number = 30) => {
  await requireSuperAdmin();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const practices = await prisma.practice.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const byDate = practices.reduce((acc, p) => {
    const date = p.createdAt.toISOString().split("T")[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fill in missing dates
  const result: { date: string; count: number }[] = [];
  const current = new Date(startDate);
  const end = new Date();

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    result.push({ date: dateStr, count: byDate[dateStr] || 0 });
    current.setDate(current.getDate() + 1);
  }

  return result;
});
