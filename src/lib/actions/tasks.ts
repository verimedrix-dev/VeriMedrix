"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import crypto from "crypto";
import { sendTaskAssignmentNotification } from "@/lib/email";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

const EVIDENCE_BUCKET = "task-evidence";

// Generate IDs for models that don't have @default(cuid())
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 25);
}

// Default empty data for error fallback
const emptyTasksData = {
  tasks: [],
  stats: { total: 0, pending: 0, completed: 0, overdue: 0 }
};

// Optimized: Single auth call + parallel DB queries for tasks page with Redis caching
export async function getTasksPageData() {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return getCachedData(
      cacheKeys.practiceTasks(practice.id),
      async () => {
        const now = new Date();

        return withDbConnection(async () => {
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
        });
      },
      CACHE_DURATIONS.SHORT // 1 minute
    );
  } catch (error) {
    console.error("Tasks page data fetch error:", error);
    return emptyTasksData;
  }
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

export async function completeTask(id: string, data?: { evidenceNotes?: string; evidenceUrl?: string }) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const task = await prisma.task.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedById: user.id,
      evidenceNotes: data?.evidenceNotes,
      evidenceUrl: data?.evidenceUrl,
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
  revalidatePath("/logbook");
  return task;
}

// Upload evidence photo for task completion
export async function uploadTaskEvidence(formData: FormData) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // Validate file type (images only)
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  const supabase = await createClient();

  // Create unique file path: practiceId/timestamp-filename
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${practice.id}/${timestamp}-${safeName}`;

  // Convert file to array buffer
  const arrayBuffer = await file.arrayBuffer();

  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Failed to upload evidence: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(EVIDENCE_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
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
      evidenceUrl: null,
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
      User_Task_assignedToIdToUser: { select: { id: true, name: true, email: true, notifyTaskAssignment: true } },
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

    // Send email notification only if user has enabled task assignment notifications
    if (assignedUser.email && assignedUser.notifyTaskAssignment) {
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

// Get today's tasks for logbook view
export async function getLogbookData(date?: Date) {
  const { practice, user } = await ensureUserAndPractice();
  if (!practice) return null;

  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get tasks for the target date
  const [tasks, templates] = await Promise.all([
    prisma.task.findMany({
      where: {
        practiceId: practice.id,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        dueTime: true,
        status: true,
        completedAt: true,
        evidenceUrl: true,
        evidenceNotes: true,
        User_Task_assignedToIdToUser: { select: { id: true, name: true } },
        User_Task_completedByIdToUser: { select: { id: true, name: true } },
        TaskTemplate: { select: { id: true, name: true, requiresEvidence: true, frequency: true, category: true } },
      },
      orderBy: [
        { dueTime: "asc" },
        { createdAt: "asc" },
      ],
    }),
    prisma.taskTemplate.findMany({
      where: { practiceId: practice.id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        frequency: true,
        requiresEvidence: true,
        category: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Calculate stats for the day
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "COMPLETED" || t.status === "VERIFIED").length;
  const pending = tasks.filter(t => t.status === "PENDING").length;
  const overdue = tasks.filter(t => t.status === "OVERDUE").length;

  return {
    tasks,
    templates,
    stats: { total, completed, pending, overdue },
    currentUserId: user?.id,
  };
}

// Generate tasks from templates for a specific date
export async function generateTasksFromTemplates(date?: Date) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Get active templates
  const templates = await prisma.taskTemplate.findMany({
    where: { practiceId: practice.id, isActive: true },
  });

  // Check which templates already have tasks for today
  const existingTasks = await prisma.task.findMany({
    where: {
      practiceId: practice.id,
      templateId: { in: templates.map(t => t.id) },
      dueDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: { templateId: true },
  });

  const existingTemplateIds = new Set(existingTasks.map(t => t.templateId));

  // Filter templates that should generate tasks today and don't already have one
  const templatesToGenerate = templates.filter(template => {
    if (existingTemplateIds.has(template.id)) return false;

    const dayOfWeek = targetDate.getDay();
    const dayOfMonth = targetDate.getDate();

    switch (template.frequency) {
      case "MULTIPLE_DAILY":
      case "DAILY":
        return true;
      case "WEEKLY":
        // Monday by default, can be configured later
        return dayOfWeek === 1;
      case "MONTHLY":
        // First of month by default
        return dayOfMonth === 1;
      default:
        return false;
    }
  });

  // Create tasks from templates
  const createdTasks = await Promise.all(
    templatesToGenerate.map(template =>
      prisma.task.create({
        data: {
          id: generateId(),
          practiceId: practice.id,
          templateId: template.id,
          title: template.name,
          description: template.description,
          dueDate: targetDate,
          status: "PENDING",
          updatedAt: new Date(),
        },
      })
    )
  );

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceTasks(practice.id)),
    invalidateCache(cacheKeys.practiceTaskStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/logbook");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return createdTasks;
}
