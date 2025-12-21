"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { getCachedData, cacheKeys, CACHE_DURATIONS } from "@/lib/redis";

export async function getAnalyticsDashboard() {
  await requireSuperAdmin();

  return getCachedData(
    cacheKeys.adminDashboard(),
    async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        newUsers30d,
        usersByRole,
        totalPractices,
        activePractices,
        practicesByTier,
        totalDocuments,
        documentsUploaded30d,
        documentsByStatus,
        totalTasks,
        tasksCompleted30d,
        overdueTasksCount,
        totalTrainingRecords,
        completedTraining30d,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.groupBy({
          by: ["role"],
          _count: true,
        }),
        prisma.practice.count(),
        prisma.practice.count({ where: { subscriptionStatus: "ACTIVE" } }),
        prisma.practice.groupBy({
          by: ["subscriptionTier"],
          _count: true,
        }),
        prisma.document.count(),
        prisma.document.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.document.groupBy({
          by: ["status"],
          _count: true,
        }),
        prisma.task.count(),
        prisma.task.count({
          where: {
            status: "COMPLETED",
            completedAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.task.count({ where: { status: "OVERDUE" } }),
        prisma.employeeTraining.count(),
        prisma.employeeTraining.count({
          where: {
            status: "COMPLETED",
            completedDate: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      return {
        users: {
          total: totalUsers,
          new30d: newUsers30d,
          byRole: usersByRole.map((r) => ({ role: r.role, count: r._count })),
        },
        practices: {
          total: totalPractices,
          active: activePractices,
          byTier: practicesByTier.map((t) => ({ tier: t.subscriptionTier, count: t._count })),
        },
        documents: {
          total: totalDocuments,
          uploaded30d: documentsUploaded30d,
          byStatus: documentsByStatus.map((s) => ({ status: s.status, count: s._count })),
        },
        tasks: {
          total: totalTasks,
          completed30d: tasksCompleted30d,
          overdue: overdueTasksCount,
        },
        training: {
          total: totalTrainingRecords,
          completed30d: completedTraining30d,
        },
      };
    },
    CACHE_DURATIONS.MEDIUM // 5 minutes
  );
}

export async function getGrowthMetrics() {
  await requireSuperAdmin();

  return getCachedData(
    cacheKeys.adminGrowth(),
    async () => {
      const now = new Date();
      const monthsAgo = (months: number) =>
        new Date(now.getFullYear(), now.getMonth() - months, 1);

      const signupsByMonth = await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const startOfMonth = monthsAgo(5 - i);
          const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

          const [practices, users] = await Promise.all([
            prisma.practice.count({
              where: {
                createdAt: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
              },
            }),
            prisma.user.count({
              where: {
                createdAt: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
              },
            }),
          ]);

          return {
            month: startOfMonth.toLocaleString("default", { month: "short" }),
            practices,
            users,
          };
        })
      );

      return { signupsByMonth };
    },
    CACHE_DURATIONS.LONG // 10 minutes
  );
}

export async function getUsageMetrics() {
  await requireSuperAdmin();

  return getCachedData(
    cacheKeys.adminUsage(),
    async () => {
      const topPractices = await prisma.practice.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              User: true,
              Document: true,
              Task: true,
            },
          },
        },
        orderBy: {
          User: { _count: "desc" },
        },
        take: 10,
      });

      const topDocumentTypes = await prisma.documentType.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { Document: true },
          },
        },
        orderBy: {
          Document: { _count: "desc" },
        },
        take: 10,
      });

      return {
        topPractices: topPractices.map((p) => ({
          id: p.id,
          name: p.name,
          users: p._count.User,
          documents: p._count.Document,
          tasks: p._count.Task,
        })),
        topDocumentTypes: topDocumentTypes.map((d) => ({
          id: d.id,
          name: d.name,
          count: d._count.Document,
        })),
      };
    },
    CACHE_DURATIONS.MEDIUM // 5 minutes
  );
}
