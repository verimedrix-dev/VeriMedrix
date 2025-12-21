"use server";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "@/lib/actions/practice";
import { prisma } from "@/lib/prisma";
import { AdminAction } from "@prisma/client";
import { headers } from "next/headers";

/**
 * Check if current user is a super admin
 */
export const isSuperAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === "SUPER_ADMIN";
});

/**
 * Get current admin user (must be SUPER_ADMIN)
 */
export const getAdminUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return null;
  }
  return user;
});

/**
 * Require super admin access, redirect to dashboard if not
 */
export async function requireSuperAdmin() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Log admin action to AdminAuditLog
 */
export async function logAdminAction(
  adminId: string,
  action: AdminAction,
  entityType: string,
  entityId?: string,
  practiceId?: string,
  details?: Record<string, unknown>
) {
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || undefined;

  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      entityType,
      entityId,
      practiceId,
      details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Get admin session for impersonation
 * Returns the impersonated user ID if in impersonation mode
 */
export async function getImpersonatedUserId(): Promise<string | null> {
  // Implementation would check session/cookie for impersonation token
  // For now, return null (no impersonation)
  return null;
}
