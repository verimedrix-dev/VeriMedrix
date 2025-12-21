"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { UserRole } from "@prisma/client";

// ============= USERS MANAGEMENT =============

export const getAdminUsers = cache(async (options?: {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  practiceId?: string;
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

  if (options?.role) {
    where.role = options.role;
  }

  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  if (options?.practiceId) {
    where.practiceId = options.practiceId;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        Practice: {
          select: {
            id: true,
            name: true,
            subscriptionTier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
});

export const getAdminUserById = cache(async (id: string) => {
  const admin = await requireSuperAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      Practice: {
        select: {
          id: true,
          name: true,
          subscriptionTier: true,
          subscriptionStatus: true,
        },
      },
      AuditLog: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      Alert: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (user) {
    await logAdminAction(admin.id, "VIEW_USER", "User", id, user.practiceId || undefined);
  }

  return user;
});

export async function suspendUser(userId: string, reason?: string) {
  const admin = await requireSuperAdmin();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  await logAdminAction(admin.id, "SUSPEND_USER", "User", userId, user.practiceId || undefined, { reason });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return user;
}

export async function activateUser(userId: string) {
  const admin = await requireSuperAdmin();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });

  await logAdminAction(admin.id, "ACTIVATE_USER", "User", userId, user.practiceId || undefined);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return user;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const admin = await requireSuperAdmin();

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await logAdminAction(admin.id, "ACTIVATE_USER", "User", userId, user.practiceId || undefined, { newRole: role });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return user;
}

export async function reset2FA(userId: string) {
  const admin = await requireSuperAdmin();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    },
  });

  await logAdminAction(admin.id, "RESET_2FA", "User", userId, user.practiceId || undefined);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return user;
}

// ============= USER ACTIVITY =============

export const getUserActivity = cache(async (userId: string, limit: number = 100) => {
  await requireSuperAdmin();

  const [auditLogs, alerts] = await Promise.all([
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.alert.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  return { auditLogs, alerts };
});
