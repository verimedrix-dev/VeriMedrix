"use server";

import { redirect } from "next/navigation";
import { cache } from "react";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/actions/practice";
import { hasPermission, canAccessRoute, Permission } from "@/lib/permissions";

/**
 * Get current user with role (cached for the request)
 */
export const getCurrentUserWithRole = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    practiceId: user.practiceId,
    isActive: user.isActive,
  };
});

/**
 * Require user to be authenticated, redirect to sign-in if not
 */
export async function requireAuth() {
  const user = await getCurrentUserWithRole();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

/**
 * Require user to have a specific permission, redirect to dashboard if not
 * @param permission - The permission to check
 * @param redirectTo - Optional custom redirect path (defaults to /dashboard)
 */
export async function requirePermission(
  permission: Permission,
  redirectTo: string = "/dashboard"
) {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Require user to have one of the specified roles, redirect to dashboard if not
 * @param allowedRoles - Array of allowed roles
 * @param redirectTo - Optional custom redirect path (defaults to /dashboard)
 */
export async function requireRole(
  allowedRoles: UserRole[],
  redirectTo: string = "/dashboard"
) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Check if user can access a specific route, redirect if not
 * @param pathname - The route pathname to check
 * @param redirectTo - Optional custom redirect path (defaults to /dashboard)
 */
export async function checkRouteAccess(
  pathname: string,
  redirectTo: string = "/dashboard"
) {
  const user = await requireAuth();

  if (!canAccessRoute(user.role, pathname)) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Check if user has a permission (without redirecting)
 * @param permission - The permission to check
 * @returns boolean indicating if user has permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  if (!user) return false;
  return hasPermission(user.role, permission);
}

/**
 * Check if user is at least a specific role level (without redirecting)
 * @param role - The minimum role required
 * @returns boolean indicating if user meets the role requirement
 */
export async function checkRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 100,
    PRACTICE_OWNER: 90,
    ADMIN: 80,
    STAFF: 50,
    VIEWER: 10,
    LOCUM: 5,
  };

  return roleHierarchy[user.role] >= roleHierarchy[role];
}

/**
 * Check if user is the practice owner
 * @returns boolean indicating if user is the practice owner
 */
export async function isOwner(): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  if (!user) return false;
  return user.role === "PRACTICE_OWNER" || user.role === "SUPER_ADMIN";
}

/**
 * Require user to be practice owner, redirect if not
 * @param redirectTo - Optional custom redirect path (defaults to /dashboard)
 */
export async function requireOwner(redirectTo: string = "/dashboard") {
  const user = await requireAuth();

  if (user.role !== "PRACTICE_OWNER" && user.role !== "SUPER_ADMIN") {
    redirect(redirectTo);
  }

  return user;
}
