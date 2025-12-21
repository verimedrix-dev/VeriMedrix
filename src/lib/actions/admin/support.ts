"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

// ============= SUPPORT TICKETS =============

// Optimized: Get admin support page data with Redis caching
export async function getAdminSupportPageData() {
  await requireSuperAdmin();

  return getCachedData(
    cacheKeys.adminSupport(),
    async () => {
      const [tickets, stats, recentErrors] = await Promise.all([
        prisma.supportTicket.findMany({
          include: {
            _count: { select: { Messages: true } },
          },
          orderBy: [
            { priority: "desc" },
            { createdAt: "desc" },
          ],
          take: 50,
        }),
        Promise.all([
          prisma.supportTicket.count(),
          prisma.supportTicket.count({ where: { status: "OPEN" } }),
          prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
          prisma.supportTicket.count({ where: { priority: "CRITICAL" } }),
          prisma.supportTicket.count({ where: { priority: "HIGH" } }),
          prisma.errorLog.count({ where: { resolved: false } }),
        ]),
        prisma.errorLog.findMany({
          where: { resolved: false },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const [totalTickets, openTickets, inProgressTickets, criticalTickets, highPriorityTickets, unresolvedErrors] = stats;

      return {
        tickets,
        stats: {
          totalTickets,
          openTickets,
          inProgressTickets,
          criticalTickets,
          highPriorityTickets,
          unresolvedErrors,
        },
        recentErrors,
      };
    },
    CACHE_DURATIONS.SHORT // 1 minute
  );
}

export const getSupportTickets = cache(async (options?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assignedToId?: string;
  limit?: number;
  offset?: number;
}) => {
  await requireSuperAdmin();

  const where: Record<string, unknown> = {};

  if (options?.status) where.status = options.status;
  if (options?.priority) where.priority = options.priority;
  if (options?.category) where.category = options.category;
  if (options?.assignedToId) where.assignedToId = options.assignedToId;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        _count: { select: { Messages: true } },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { tickets, total };
});

export const getSupportTicketById = cache(async (id: string) => {
  await requireSuperAdmin();

  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      Messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
});

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const admin = await requireSuperAdmin();

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
    },
  });

  await logAdminAction(admin.id, status === "CLOSED" ? "CLOSE_TICKET" : "RESPOND_TICKET", "SupportTicket", id, ticket.practiceId || undefined);

  // Invalidate caches
  await invalidateCache(cacheKeys.adminSupport());

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);

  return ticket;
}

export async function assignTicket(id: string, assignedToId: string) {
  await requireSuperAdmin();

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: { assignedToId },
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.adminSupport());

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);

  return ticket;
}

export async function replyToTicket(ticketId: string, message: string) {
  const admin = await requireSuperAdmin();

  const reply = await prisma.supportTicketMessage.create({
    data: {
      ticketId,
      senderId: admin.id,
      senderEmail: admin.email,
      senderName: admin.name,
      isFromAdmin: true,
      message,
      attachments: [],
    },
  });

  // Update ticket status to waiting for response
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "WAITING_RESPONSE" },
  });

  await logAdminAction(admin.id, "RESPOND_TICKET", "SupportTicket", ticketId);

  // Invalidate caches
  await invalidateCache(cacheKeys.adminSupport());

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);

  return reply;
}

// ============= ERROR LOGS =============

export const getErrorLogs = cache(async (options?: {
  errorType?: string;
  resolved?: boolean;
  practiceId?: string;
  limit?: number;
  offset?: number;
}) => {
  await requireSuperAdmin();

  const where: Record<string, unknown> = {};

  if (options?.errorType) where.errorType = options.errorType;
  if (options?.resolved !== undefined) where.resolved = options.resolved;
  if (options?.practiceId) where.practiceId = options.practiceId;

  const [errors, total] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.errorLog.count({ where }),
  ]);

  return { errors, total };
});

export async function resolveError(id: string) {
  const admin = await requireSuperAdmin();

  const error = await prisma.errorLog.update({
    where: { id },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: admin.id,
    },
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.adminSupport());

  return error;
}

// ============= EMAIL LOGS =============

export const getEmailLogs = cache(async (options?: {
  status?: string;
  practiceId?: string;
  limit?: number;
  offset?: number;
}) => {
  await requireSuperAdmin();

  const where: Record<string, unknown> = {};

  if (options?.status) where.status = options.status;
  if (options?.practiceId) where.practiceId = options.practiceId;

  const [emails, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.emailLog.count({ where }),
  ]);

  return { emails, total };
});

// ============= ADMIN AUDIT LOG =============

export const getAdminAuditLogs = cache(async (options?: {
  adminId?: string;
  action?: string;
  practiceId?: string;
  limit?: number;
  offset?: number;
}) => {
  await requireSuperAdmin();

  const where: Record<string, unknown> = {};

  if (options?.adminId) where.adminId = options.adminId;
  if (options?.action) where.action = options.action;
  if (options?.practiceId) where.practiceId = options.practiceId;

  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 100,
      skip: options?.offset || 0,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  return { logs, total };
});

// ============= EMAIL TEMPLATES =============

export const getEmailTemplates = cache(async () => {
  await requireSuperAdmin();

  return prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });
});
