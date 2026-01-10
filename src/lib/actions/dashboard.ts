"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { getCachedData, cacheKeys, CACHE_DURATIONS } from "@/lib/redis";

// Default empty dashboard data for error fallback
const emptyDashboardData = {
  documents: [],
  tasks: [],
  docStats: { total: 0, current: 0, expiringSoon: 0, expired: 0 },
  taskStats: { total: 0, pending: 0, completed: 0, overdue: 0 }
};

// Optimized dashboard with Redis caching and error handling
export async function getDashboardData() {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return getCachedData(
      cacheKeys.practiceDashboard(practice.id),
      async () => {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        return withDbConnection(async () => {
          const [
            docStats,
            expiringDocs,
            expiredDocs,
            pendingTasks,
            taskStats
          ] = await Promise.all([
            // Aggregated document stats in ONE query
            prisma.$queryRaw<[{ total: bigint; current: bigint; expiring: bigint; expired: bigint }]>`
              SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE "expiryDate" IS NULL OR "expiryDate" > ${thirtyDaysFromNow}) as current,
                COUNT(*) FILTER (WHERE "expiryDate" > ${now} AND "expiryDate" <= ${thirtyDaysFromNow}) as expiring,
                COUNT(*) FILTER (WHERE "expiryDate" < ${now}) as expired
              FROM "Document"
              WHERE "practiceId" = ${practice.id}
            `,
            // Only fetch 5 expiring documents (what we display)
            prisma.document.findMany({
              where: {
                practiceId: practice.id,
                expiryDate: { gt: now, lte: ninetyDaysFromNow }
              },
              select: { id: true, title: true, expiryDate: true },
              orderBy: { expiryDate: "asc" },
              take: 5
            }),
            // Only fetch 3 expired documents
            prisma.document.findMany({
              where: {
                practiceId: practice.id,
                expiryDate: { lt: now }
              },
              select: { id: true, title: true, expiryDate: true },
              orderBy: { expiryDate: "desc" },
              take: 3
            }),
            // Only fetch 5 pending/overdue tasks
            prisma.task.findMany({
              where: {
                practiceId: practice.id,
                status: { in: ["PENDING", "OVERDUE"] }
              },
              select: { id: true, title: true, dueDate: true, dueTime: true, status: true },
              orderBy: { dueDate: "asc" },
              take: 5
            }),
            // Aggregated task stats in ONE query
            prisma.$queryRaw<[{ total: bigint; pending: bigint; completed: bigint; overdue: bigint }]>`
              SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" >= ${now}) as pending,
                COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
                COUNT(*) FILTER (WHERE status IN ('PENDING', 'OVERDUE') AND "dueDate" < ${now}) as overdue
              FROM "Task"
              WHERE "practiceId" = ${practice.id}
            `
          ]);

          const stats = docStats[0];
          const tStats = taskStats[0];

          return {
            documents: [...expiredDocs, ...expiringDocs],
            tasks: pendingTasks,
            docStats: {
              total: Number(stats?.total || 0),
              current: Number(stats?.current || 0),
              expiringSoon: Number(stats?.expiring || 0),
              expired: Number(stats?.expired || 0)
            },
            taskStats: {
              total: Number(tStats?.total || 0),
              pending: Number(tStats?.pending || 0),
              completed: Number(tStats?.completed || 0),
              overdue: Number(tStats?.overdue || 0)
            }
          };
        });
      },
      CACHE_DURATIONS.SHORT // 1 minute - dashboard should be fairly fresh
    );
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    // Return empty data instead of throwing - prevents 503
    return emptyDashboardData;
  }
}
