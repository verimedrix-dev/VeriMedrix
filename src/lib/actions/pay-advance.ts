"use server";

import { revalidatePath } from "next/cache";
import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { hasPermission } from "@/lib/permissions";
import { PayAdvanceStatus } from "@prisma/client";
import { isFeatureAvailable } from "@/lib/subscription-config";

export type PayAdvanceWithDetails = {
  id: string;
  employeeId: string;
  employeeName: string;
  requestedAmount: number;
  approvedAmount: number | null;
  reason: string | null;
  status: PayAdvanceStatus;
  requestedById: string;
  requestedByName: string;
  requestedAt: Date;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  deductedAt: Date | null;
  notes: string | null;
};

/**
 * Request a pay advance (Employee action)
 */
export async function requestPayAdvance(
  employeeId: string,
  amount: number,
  reason?: string
): Promise<{ success: boolean; error?: string; advanceId?: string }> {
  try {
    const { user, practice } = await ensureUserAndPractice();
    if (!user || !practice) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if payroll feature is available (excludes OHSC Essential)
    if (!isFeatureAvailable(practice.subscriptionTier, "payroll")) {
      return {
        success: false,
        error: "Pay advances are only available on Practice Essentials and Professional plans. Please upgrade to access this feature.",
      };
    }

    // Validate amount
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than 0" };
    }

    // Get employee details
    const employee = await withDbConnection(() =>
      prisma.employee.findUnique({
        where: {
          id: employeeId,
          practiceId: practice.id,
          isActive: true,
        },
      })
    );

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    // Check if amount is reasonable (max 50% of gross salary)
    const maxAdvance = (employee.grossSalary || 0) * 0.5;
    if (amount > maxAdvance) {
      return {
        success: false,
        error: `Maximum advance allowed is R${maxAdvance.toFixed(2)} (50% of monthly salary)`,
      };
    }

    // Check for existing pending advances
    const existingPending = await withDbConnection(() =>
      prisma.payAdvance.count({
        where: {
          employeeId,
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      })
    );

    if (existingPending > 0) {
      return {
        success: false,
        error: "You already have a pending or approved advance request",
      };
    }

    // Create the advance request
    const advance = await withDbConnection(() =>
      prisma.payAdvance.create({
        data: {
          employeeId,
          practiceId: practice.id,
          requestedAmount: amount,
          reason,
          status: "PENDING",
          requestedById: user.id,
        },
      })
    );

    revalidatePath("/payroll");
    revalidatePath("/my-profile");

    return { success: true, advanceId: advance.id };
  } catch (error) {
    console.error("Error requesting pay advance:", error);
    return { success: false, error: "Failed to request pay advance" };
  }
}

/**
 * Approve a pay advance (Admin/Owner action)
 */
export async function approvePayAdvance(
  advanceId: string,
  approvedAmount?: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, practice } = await ensureUserAndPractice();
    if (!user || !practice) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if payroll feature is available
    if (!isFeatureAvailable(practice.subscriptionTier, "payroll")) {
      return { success: false, error: "This feature is not available on your current plan" };
    }

    // Check permissions
    if (!hasPermission(user.role, "payroll_full")) {
      return { success: false, error: "You don't have permission to approve advances" };
    }

    // Get the advance
    const advance = await withDbConnection(() =>
      prisma.payAdvance.findUnique({
        where: { id: advanceId },
        include: {
          Employee: true,
        },
      })
    );

    if (!advance) {
      return { success: false, error: "Advance request not found" };
    }

    if (advance.practiceId !== practice.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (advance.status !== "PENDING") {
      return { success: false, error: "This advance has already been reviewed" };
    }

    // Validate approved amount
    const finalAmount = approvedAmount || advance.requestedAmount;
    const maxAdvance = (advance.Employee.grossSalary || 0) * 0.5;

    if (finalAmount > maxAdvance) {
      return {
        success: false,
        error: `Approved amount cannot exceed R${maxAdvance.toFixed(2)} (50% of monthly salary)`,
      };
    }

    // Update the advance
    await withDbConnection(() =>
      prisma.payAdvance.update({
        where: { id: advanceId },
        data: {
          status: "APPROVED",
          approvedAmount: finalAmount,
          reviewedById: user.id,
          reviewedAt: new Date(),
          notes,
        },
      })
    );

    revalidatePath("/payroll");
    revalidatePath("/my-profile");

    return { success: true };
  } catch (error) {
    console.error("Error approving pay advance:", error);
    return { success: false, error: "Failed to approve pay advance" };
  }
}

/**
 * Reject a pay advance (Admin/Owner action)
 */
export async function rejectPayAdvance(
  advanceId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, practice } = await ensureUserAndPractice();
    if (!user || !practice) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if payroll feature is available
    if (!isFeatureAvailable(practice.subscriptionTier, "payroll")) {
      return { success: false, error: "This feature is not available on your current plan" };
    }

    // Check permissions
    if (!hasPermission(user.role, "payroll_full")) {
      return { success: false, error: "You don't have permission to reject advances" };
    }

    // Get the advance
    const advance = await withDbConnection(() =>
      prisma.payAdvance.findUnique({
        where: { id: advanceId },
      })
    );

    if (!advance) {
      return { success: false, error: "Advance request not found" };
    }

    if (advance.practiceId !== practice.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (advance.status !== "PENDING") {
      return { success: false, error: "This advance has already been reviewed" };
    }

    // Update the advance
    await withDbConnection(() =>
      prisma.payAdvance.update({
        where: { id: advanceId },
        data: {
          status: "REJECTED",
          rejectionReason,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      })
    );

    revalidatePath("/payroll");
    revalidatePath("/my-profile");

    return { success: true };
  } catch (error) {
    console.error("Error rejecting pay advance:", error);
    return { success: false, error: "Failed to reject pay advance" };
  }
}

/**
 * Get all pay advances for the practice
 */
export async function getPayAdvances(
  status?: PayAdvanceStatus
): Promise<PayAdvanceWithDetails[]> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) {
      return [];
    }

    const advances = await withDbConnection(() =>
      prisma.payAdvance.findMany({
        where: {
          practiceId: practice.id,
          ...(status && { status }),
        },
        include: {
          Employee: {
            select: {
              fullName: true,
            },
          },
          RequestedBy: {
            select: {
              name: true,
            },
          },
          ReviewedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          requestedAt: "desc",
        },
      })
    );

    return advances.map((advance) => ({
      id: advance.id,
      employeeId: advance.employeeId,
      employeeName: advance.Employee.fullName,
      requestedAmount: advance.requestedAmount,
      approvedAmount: advance.approvedAmount,
      reason: advance.reason,
      status: advance.status,
      requestedById: advance.requestedById,
      requestedByName: advance.RequestedBy.name,
      requestedAt: advance.requestedAt,
      reviewedById: advance.reviewedById,
      reviewedByName: advance.ReviewedBy?.name ?? null,
      reviewedAt: advance.reviewedAt,
      rejectionReason: advance.rejectionReason,
      deductedAt: advance.deductedAt,
      notes: advance.notes,
    }));
  } catch (error) {
    console.error("Error fetching pay advances:", error);
    return [];
  }
}

/**
 * Get pay advances for a specific employee
 */
export async function getEmployeePayAdvances(
  employeeId: string
): Promise<PayAdvanceWithDetails[]> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) {
      return [];
    }

    const advances = await withDbConnection(() =>
      prisma.payAdvance.findMany({
        where: {
          employeeId,
          practiceId: practice.id,
        },
        include: {
          Employee: {
            select: {
              fullName: true,
            },
          },
          RequestedBy: {
            select: {
              name: true,
            },
          },
          ReviewedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          requestedAt: "desc",
        },
      })
    );

    return advances.map((advance) => ({
      id: advance.id,
      employeeId: advance.employeeId,
      employeeName: advance.Employee.fullName,
      requestedAmount: advance.requestedAmount,
      approvedAmount: advance.approvedAmount,
      reason: advance.reason,
      status: advance.status,
      requestedById: advance.requestedById,
      requestedByName: advance.RequestedBy.name,
      requestedAt: advance.requestedAt,
      reviewedById: advance.reviewedById,
      reviewedByName: advance.ReviewedBy?.name ?? null,
      reviewedAt: advance.reviewedAt,
      rejectionReason: advance.rejectionReason,
      deductedAt: advance.deductedAt,
      notes: advance.notes,
    }));
  } catch (error) {
    console.error("Error fetching employee pay advances:", error);
    return [];
  }
}

/**
 * Mark a pay advance as deducted (called during payroll processing)
 */
export async function markPayAdvanceAsDeducted(
  advanceId: string,
  payrollRunId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) {
      return { success: false, error: "Unauthorized" };
    }

    await withDbConnection(() =>
      prisma.payAdvance.update({
        where: {
          id: advanceId,
          practiceId: practice.id,
          status: "APPROVED",
        },
        data: {
          status: "DEDUCTED",
          deductedFromPayrollId: payrollRunId,
          deductedAt: new Date(),
        },
      })
    );

    revalidatePath("/payroll");

    return { success: true };
  } catch (error) {
    console.error("Error marking pay advance as deducted:", error);
    return { success: false, error: "Failed to mark advance as deducted" };
  }
}
