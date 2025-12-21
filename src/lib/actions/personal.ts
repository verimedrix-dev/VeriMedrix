"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/actions/practice";
import { redirect } from "next/navigation";

/**
 * Get the employee record linked to the current user (for VIEWER role)
 */
export async function getMyEmployeeRecord() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Find the employee linked to this user
  const employee = await withDbConnection(() =>
    prisma.employee.findFirst({
      where: {
        userId: user.id,
        practiceId: user.practiceId || undefined,
      },
      include: {
        LeaveRequest: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        EmployeeTraining: {
          orderBy: { expiryDate: "asc" },
        },
      },
    })
  );

  return employee;
}

/**
 * Get tasks assigned to the current user
 */
export async function getMyTasks() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const tasks = await withDbConnection(() =>
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        practiceId: user.practiceId || undefined,
      },
      orderBy: { dueDate: "asc" },
      include: {
        TaskTemplate: true,
      },
    })
  );

  return tasks;
}

/**
 * Get leave balance for the current user's linked employee
 */
export async function getMyLeaveBalance() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const employee = await withDbConnection(() =>
    prisma.employee.findFirst({
      where: {
        userId: user.id,
        practiceId: user.practiceId || undefined,
      },
      select: {
        id: true,
        fullName: true,
        annualLeaveBalance: true,
        sickLeaveBalance: true,
        familyLeaveBalance: true,
      },
    })
  );

  return employee;
}

/**
 * Get the employee ID for the current user (for VIEWER role to auto-select themselves)
 */
export async function getMyEmployeeId() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const employee = await withDbConnection(() =>
    prisma.employee.findFirst({
      where: {
        userId: user.id,
        practiceId: user.practiceId || undefined,
      },
      select: {
        id: true,
        fullName: true,
      },
    })
  );

  return employee;
}

/**
 * Check if the current user is a VIEWER role
 */
export async function isViewerRole() {
  const user = await getCurrentUser();
  return user?.role === "VIEWER";
}

/**
 * Check if the current user is STAFF or VIEWER role (non-admin employees)
 */
export async function isStaffOrViewer() {
  const user = await getCurrentUser();
  return user?.role === "STAFF" || user?.role === "VIEWER";
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole() {
  const user = await getCurrentUser();
  return user?.role;
}

/**
 * Get all leave requests for the current user's linked employee
 */
export async function getMyLeaveRequests() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const employee = await withDbConnection(() =>
    prisma.employee.findFirst({
      where: {
        userId: user.id,
        practiceId: user.practiceId || undefined,
      },
      select: {
        id: true,
      },
    })
  );

  if (!employee) {
    return [];
  }

  const leaveRequests = await withDbConnection(() =>
    prisma.leaveRequest.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: { createdAt: "desc" },
    })
  );

  return leaveRequests;
}
