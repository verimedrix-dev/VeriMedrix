"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

export async function getSubscriptionOverview() {
  await requireSuperAdmin();

  return getCachedData(
    cacheKeys.adminSubscriptions(),
    async () => {
      const [
        totalPractices,
        byTier,
        byStatus,
        recentPractices,
      ] = await Promise.all([
        prisma.practice.count(),
        prisma.practice.groupBy({
          by: ["subscriptionTier"],
          _count: true,
        }),
        prisma.practice.groupBy({
          by: ["subscriptionStatus"],
          _count: true,
        }),
        prisma.practice.findMany({
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      return {
        total: totalPractices,
        byTier: byTier.map((t) => ({ tier: t.subscriptionTier, count: t._count })),
        byStatus: byStatus.map((s) => ({ status: s.subscriptionStatus, count: s._count })),
        recentPractices,
      };
    },
    CACHE_DURATIONS.MEDIUM // 5 minutes
  );
}

export async function getSubscriptionsList(params?: {
  tier?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireSuperAdmin();

  const { tier, status, search, page = 1, limit = 20 } = params || {};

  // Don't cache filtered/searched results
  const where: Record<string, unknown> = {};

  if (tier && tier !== "all") {
    where.subscriptionTier = tier;
  }

  if (status && status !== "all") {
    where.subscriptionStatus = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [practices, total] = await Promise.all([
    prisma.practice.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        createdAt: true,
        _count: {
          select: { User: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.practice.count({ where }),
  ]);

  return {
    practices: practices.map((p) => ({
      ...p,
      userCount: p._count.User,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updatePracticeSubscription(
  practiceId: string,
  data: {
    tier?: string;
    status?: string;
    trialEndsAt?: Date;
  }
) {
  await requireSuperAdmin();

  const updateData: Record<string, unknown> = {};

  if (data.tier) {
    updateData.subscriptionTier = data.tier;
  }

  if (data.status) {
    updateData.subscriptionStatus = data.status;
  }

  if (data.trialEndsAt) {
    updateData.trialEndsAt = data.trialEndsAt;
  }

  const result = await prisma.practice.update({
    where: { id: practiceId },
    data: updateData,
  });

  // Invalidate cache after update
  await invalidateCache(cacheKeys.adminSubscriptions());

  return result;
}
