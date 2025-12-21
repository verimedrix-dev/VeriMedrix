"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getCachedData, cacheKeys, CACHE_DURATIONS } from "@/lib/redis";

// ============= SYSTEM HEALTH METRICS =============

export async function getSystemHealth() {
  await requireSuperAdmin();

  return getCachedData(
    cacheKeys.adminHealth(),
    async () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        totalErrors24h,
        unresolvedErrors,
        errorsByType,
        emailsSent24h,
        emailsFailed24h,
        apiRequests24h,
        totalPractices,
        totalUsers,
        totalDocuments,
        totalTasks,
      ] = await Promise.all([
        prisma.errorLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),
        prisma.errorLog.count({
          where: { resolved: false },
        }),
        prisma.errorLog.groupBy({
          by: ["errorType"],
          where: { createdAt: { gte: oneDayAgo } },
          _count: true,
          orderBy: { _count: { errorType: "desc" } },
          take: 5,
        }),
        prisma.emailLog.count({
          where: {
            status: "SENT",
            createdAt: { gte: oneDayAgo },
          },
        }),
        prisma.emailLog.count({
          where: {
            status: "FAILED",
            createdAt: { gte: oneDayAgo },
          },
        }),
        prisma.apiUsageLog.count({
          where: { createdAt: { gte: oneDayAgo } },
        }),
        prisma.practice.count(),
        prisma.user.count(),
        prisma.document.count(),
        prisma.task.count(),
      ]);

      return {
        errors: {
          total24h: totalErrors24h,
          unresolved: unresolvedErrors,
          byType: errorsByType,
        },
        emails: {
          sent24h: emailsSent24h,
          failed24h: emailsFailed24h,
          successRate: emailsSent24h > 0
            ? Math.round((emailsSent24h / (emailsSent24h + emailsFailed24h)) * 100)
            : 100,
        },
        api: {
          requests24h: apiRequests24h,
        },
        database: {
          practices: totalPractices,
          users: totalUsers,
          documents: totalDocuments,
          tasks: totalTasks,
        },
      };
    },
    CACHE_DURATIONS.SHORT // 1 minute for health data
  );
}

export async function getRecentErrors(limit: number = 20) {
  await requireSuperAdmin();

  // Don't cache errors - we want fresh data
  return prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getApiPerformance() {
  await requireSuperAdmin();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const apiByEndpoint = await prisma.apiUsageLog.groupBy({
    by: ["endpoint"],
    where: { createdAt: { gte: oneDayAgo } },
    _count: true,
    _avg: { responseTime: true },
    orderBy: { _count: { endpoint: "desc" } },
    take: 10,
  });

  const hourlyRequests = await prisma.$queryRaw<Array<{ hour: Date; count: bigint }>>`
    SELECT
      DATE_TRUNC('hour', "createdAt") as hour,
      COUNT(*) as count
    FROM "ApiUsageLog"
    WHERE "createdAt" >= ${oneDayAgo}
    GROUP BY DATE_TRUNC('hour', "createdAt")
    ORDER BY hour ASC
  `;

  return {
    byEndpoint: apiByEndpoint.map(e => ({
      endpoint: e.endpoint,
      count: e._count,
      avgResponseTime: Math.round(e._avg.responseTime || 0),
    })),
    hourly: hourlyRequests.map(h => ({
      hour: h.hour,
      count: Number(h.count),
    })),
  };
}

export async function getEmailDeliveryStats() {
  await requireSuperAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dailyStats = await prisma.$queryRaw<Array<{ date: Date; status: string; count: bigint }>>`
    SELECT
      DATE_TRUNC('day', "createdAt") as date,
      status,
      COUNT(*) as count
    FROM "EmailLog"
    WHERE "createdAt" >= ${sevenDaysAgo}
    GROUP BY DATE_TRUNC('day', "createdAt"), status
    ORDER BY date ASC
  `;

  const byTemplate = await prisma.emailLog.groupBy({
    by: ["templateId"],
    where: { createdAt: { gte: sevenDaysAgo } },
    _count: true,
    orderBy: { _count: { templateId: "desc" } },
    take: 10,
  });

  return {
    daily: dailyStats.map(s => ({
      date: s.date,
      status: s.status,
      count: Number(s.count),
    })),
    byTemplate: byTemplate.map(t => ({
      templateId: t.templateId,
      count: t._count,
    })),
  };
}

export async function markErrorResolved(errorId: string) {
  const admin = await requireSuperAdmin();

  return prisma.errorLog.update({
    where: { id: errorId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: admin.id,
    },
  });
}

export async function markAllErrorsResolved() {
  const admin = await requireSuperAdmin();

  return prisma.errorLog.updateMany({
    where: { resolved: false },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: admin.id,
    },
  });
}
