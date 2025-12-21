"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import crypto from "crypto";
import { sendTaskAssignmentNotification } from "@/lib/email";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

// Generate IDs for models that don't have @default(cuid())
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 25);
}

// Optimized: Single auth call + parallel DB queries for tasks page with Redis caching
export async function getTasksPageData() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return getCachedData(
    cacheKeys.practiceTasks(practice.id),
    async () => {
      const now = new Date();

      // Run all queries in parallel - use single raw SQL for stats
      const [tasks, stats] = await Promise.all([
        prisma.task.findMany({
          where: { practiceId: practice.id },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            dueTime: true,
            status: true,
            completedAt: true,
            evidenceUrl: true,
            createdAt: true,
            User_Task_assignedToIdToUser: { select: { id: true, name: true } },
            User_Task_completedByIdToUser: { select: { id: true, name: true } },
            TaskTemplate: { select: { id: true, name: true, requiresEvidence: true } },
          },
          orderBy: { dueDate: "asc" },
          take: 100 // Pagination
        }),
        // Single aggregated query for all stats (4x faster)
        prisma.$queryRaw<[{ total: bigint; pending: bigint; completed: bigint; overdue: bigint }]>`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'PENDING' AND "dueDate" >= ${now}) as pending,
            COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
            COUNT(*) FILTER (WHERE status = 'OVERDUE' OR (status = 'PENDING' AND "dueDate" < ${now})) as overdue
          FROM "Task"
          WHERE "practiceId" = ${practice.id}
        `
      ]);

      // Update overdue tasks in background (don't await)
      prisma.task.updateMany({
        where: {
          practiceId: practice.id,
          status: "PENDING",
          dueDate: { lt: now }
        },
        data: { status: "OVERDUE" }
      }).catch(() => {});

      const s = stats[0];
      return {
        tasks,
        stats: {
          total: Number(s?.total || 0),
          pending: Number(s?.pending || 0),
          completed: Number(s?.completed || 0),
          overdue: Number(s?.overdue || 0)
        }
      };
    },
    CACHE_DURATIONS.SHORT // 1 minute
  );
}

export async function getTasks(filter?: {
  status?: "PENDING" | "COMPLETED" | "OVERDUE" | "VERIFIED";
  assignedToId?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const where: Record<string, unknown> = { practiceId: practice.id };
  if (filter?.status) where.status = filter.status;
  if (filter?.assignedToId) where.assignedToId = filter.assignedToId;

  return await prisma.task.findMany({
    where,
    include: {
      User_Task_assignedToIdToUser: true,
      User_Task_completedByIdToUser: true,
      TaskTemplate: true,
    },
    orderBy: { dueDate: "asc" }
  });
}

// Lightweight tasks for calendar - only essential fields
export const getTasksForCalendar = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.task.findMany({
    where: { practiceId: practice.id },
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
    },
    orderBy: { dueDate: "asc" }
  });
});

export async function createTask(data: {
  title: string;
  description?: string;
  dueDate: Date;
  dueTime?: string;
  assignedToId?: string;
  templateId?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const task = await prisma.task.create({
    data: {
      id: generateId(),
      practiceId: practice.id,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      assignedToId: data.assignedToId || user.id,
      templateId: data.templateId,
      status: "PENDING",
      updatedAt: new Date(),
    }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceTasks(practice.id)),
    invalidateCache(cacheKeys.practiceTaskStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function updateTask(id: string, data: {
  title?: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  assignedToId?: string;
  status?: "PENDING" | "COMPLETED" | "OVERDUE" | "VERIFIED";
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const task = await prisma.task.update({
    where: { id, practiceId: practice.id },
    data
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceTasks(practice.id)),
    invalidateCache(cacheKeys.practiceTaskStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function completeTask(id: string, evidenceNotes?: string) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const task = await prisma.task.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedById: user.id,
      evidenceNotes,
    }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceTasks(practice.id)),
    invalidateCache(cacheKeys.practiceTaskStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function uncompleteTask(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const task = await prisma.task.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "PENDING",
      completedAt: null,
      completedById: null,
      evidenceNotes: null,
    }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceTasks(practice.id)),
    invalidateCache(cacheKeys.practiceTaskStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function deleteTask(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  await prisma.task.delete({
    where: { id, practiceId: practice.id }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceTasks(practice.id)),
    invalidateCache(cacheKeys.practiceTaskStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function getTaskStats() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const now = new Date();

  const [total, pending, completed, overdue] = await Promise.all([
    prisma.task.count({ where: { practiceId: practice.id } }),
    prisma.task.count({
      where: {
        practiceId: practice.id,
        status: "PENDING",
        dueDate: { gte: now }
      }
    }),
    prisma.task.count({
      where: {
        practiceId: practice.id,
        status: "COMPLETED"
      }
    }),
    prisma.task.count({
      where: {
        practiceId: practice.id,
        status: "PENDING",
        dueDate: { lt: now }
      }
    })
  ]);

  // Update overdue tasks
  await prisma.task.updateMany({
    where: {
      practiceId: practice.id,
      status: "PENDING",
      dueDate: { lt: now }
    },
    data: { status: "OVERDUE" }
  });

  return { total, pending, completed, overdue };
}

export async function getTaskTemplates() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.taskTemplate.findMany({
    where: { practiceId: practice.id, isActive: true },
    orderBy: { name: "asc" }
  });
}

export async function createTaskTemplate(data: {
  name: string;
  description?: string;
  frequency: "MULTIPLE_DAILY" | "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "BIANNUALLY" | "ANNUALLY" | "EVERY_TWO_YEARS" | "EVERY_FIVE_YEARS" | "CUSTOM";
  requiresEvidence?: boolean;
  category?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  return await prisma.taskTemplate.create({
    data: {
      id: generateId(),
      practiceId: practice.id,
      createdById: user.id,
      name: data.name,
      description: data.description,
      frequency: data.frequency,
      requiresEvidence: data.requiresEvidence,
      category: data.category,
      updatedAt: new Date(),
    }
  });
}

// Get team members for task assignment dropdown
export const getPracticeTeamMembers = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await withDbConnection(() =>
    prisma.user.findMany({
      where: { practiceId: practice.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    })
  );
});

// Assign task to a team member
export async function assignTask(taskId: string, assignedToId: string | null) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const task = await prisma.task.update({
    where: { id: taskId, practiceId: practice.id },
    data: {
      assignedToId,
      updatedAt: new Date(),
    },
    include: {
      User_Task_assignedToIdToUser: { select: { id: true, name: true, email: true } },
    }
  });

  // Create an in-app alert and send email for the assigned user
  if (assignedToId && task.User_Task_assignedToIdToUser) {
    const assignedUser = task.User_Task_assignedToIdToUser;

    // Create in-app alert
    await prisma.alert.create({
      data: {
        id: generateId(),
        practiceId: practice.id,
        recipientId: assignedToId,
        alertType: "TASK_ASSIGNED",
        relatedTaskId: taskId,
        message: `You have been assigned a new task: "${task.title}"`,
        channel: "IN_APP",
        scheduledFor: new Date(),
        status: "PENDING",
      }
    });

    // Send email notification (don't await to avoid blocking)
    if (assignedUser.email) {
      sendTaskAssignmentNotification(
        assignedUser.email,
        assignedUser.name || assignedUser.email.split("@")[0],
        task.title,
        task.description || "",
        task.dueDate.toLocaleDateString("en-ZA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        task.dueTime || undefined
      ).catch((err) => console.error("Failed to send task assignment email:", err));
    }
  }

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceTasks(practice.id)),
    invalidateCache(cacheKeys.practiceTaskStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
    invalidateCache(cacheKeys.practiceAlerts(practice.id)),
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}
