"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { EmploymentType, LeaveType, LeaveStatus, WarningType, WarningCategory, ProfessionalBody, KpiReviewStatus } from "@prisma/client";
import crypto from "crypto";
import { notifyPracticeOwners } from "./alerts";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

// Generate IDs for models that don't have @default(cuid())
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 25);
}

// =============================================================================
// EMPLOYEE CRUD
// =============================================================================

// Optimized employee list for the main page - minimal data with Redis caching
export async function getEmployeesListData() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return { employees: [], stats: null };

  return getCachedData(
    cacheKeys.practiceEmployees(practice.id),
    async () => {
      const now = new Date();

      // Parallel fetch: employees list + stats
      const [employees, total, active, pendingLeave, activeWarnings] = await withDbConnection(() =>
        Promise.all([
          prisma.employee.findMany({
            where: { practiceId: practice.id },
            select: {
              id: true,
              fullName: true,
              position: true,
              department: true,
              email: true,
              phone: true,
              isActive: true,
              employmentType: true,
              hireDate: true,
              _count: {
                select: {
                  Warning: { where: { isActive: true } },
                  LeaveRequest: { where: { status: "PENDING" } },
                },
              },
            },
            orderBy: { fullName: "asc" },
          }),
          prisma.employee.count({ where: { practiceId: practice.id } }),
          prisma.employee.count({ where: { practiceId: practice.id, isActive: true } }),
          prisma.leaveRequest.count({
            where: { Employee: { practiceId: practice.id }, status: "PENDING" },
          }),
          prisma.warning.count({
            where: { Employee: { practiceId: practice.id }, isActive: true, expiresAt: { gt: now } },
          }),
        ])
      );

      return {
        employees,
        stats: { total, active, pendingLeave, activeWarnings },
      };
    },
    CACHE_DURATIONS.SHORT // 1 minute
  );
}

export async function getEmployees(filter?: { isActive?: boolean }) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const where: Record<string, unknown> = { practiceId: practice.id };
  if (filter?.isActive !== undefined) where.isActive = filter.isActive;

  return await withDbConnection(() =>
    prisma.employee.findMany({
      where,
      include: {
        EmployeeDocument: true,
        LeaveRequest: {
          where: { status: "PENDING" },
          take: 5,
        },
        Warning: {
          where: { isActive: true },
        },
        EmployeeTraining: {
          orderBy: { expiryDate: "asc" },
        },
        ProfessionalRegistration: {
          where: { isActive: true },
        },
      },
      orderBy: { fullName: "asc" },
    })
  );
}

// Lightweight employee list for dropdowns/dialogs - only basic info
export const getEmployeesBasic = cache(async (filter?: { isActive?: boolean }) => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const where: Record<string, unknown> = { practiceId: practice.id };
  if (filter?.isActive !== undefined) where.isActive = filter.isActive;

  return await withDbConnection(() =>
    prisma.employee.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        position: true,
      },
      orderBy: { fullName: "asc" },
    })
  );
});

export const getEmployee = cache(async (id: string) => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return await prisma.employee.findFirst({
    where: { id, practiceId: practice.id },
    include: {
      EmployeeDocument: {
        orderBy: { createdAt: "desc" },
        take: 20, // Limit to recent documents
      },
      LeaveRequest: {
        orderBy: { createdAt: "desc" },
        take: 10, // Limit to recent requests
      },
      Warning: {
        orderBy: { issuedAt: "desc" },
        take: 10, // Limit to recent warnings
      },
      KpiReview: {
        orderBy: [{ year: "desc" }, { quarter: "desc" }],
        take: 4, // Last 4 quarters
        include: {
          goals: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
});

export async function createEmployee(data: {
  fullName: string;
  position: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  address?: string;
  dateOfBirth?: Date;
  employeeNumber?: string;
  department?: string;
  hireDate?: Date;
  employmentType?: EmploymentType;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const employee = await prisma.employee.create({
    data: {
      id: generateId(),
      practiceId: practice.id,
      fullName: data.fullName,
      position: data.position,
      email: data.email,
      phone: data.phone,
      idNumber: data.idNumber,
      address: data.address,
      dateOfBirth: data.dateOfBirth,
      employeeNumber: data.employeeNumber,
      department: data.department,
      hireDate: data.hireDate,
      employmentType: data.employmentType || "PERMANENT",
      updatedAt: new Date(),
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceEmployees(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/employees");
  return employee;
}

export async function updateEmployee(
  id: string,
  data: {
    fullName?: string;
    position?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    address?: string;
    dateOfBirth?: Date;
    employeeNumber?: string;
    department?: string;
    hireDate?: Date;
    terminationDate?: Date;
    employmentType?: EmploymentType;
    annualLeaveBalance?: number;
    sickLeaveBalance?: number;
    familyLeaveBalance?: number;
    hpcsaNumber?: string;
    hpcsaExpiry?: Date;
    sancNumber?: string;
    sancExpiry?: Date;
    sapcNumber?: string;
    sapcExpiry?: Date;
    blsExpiry?: Date;
    jobDescriptionSigned?: boolean;
    jobDescriptionSignedAt?: Date;
    isActive?: boolean;
  }
) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const employee = await prisma.employee.update({
    where: { id, practiceId: practice.id },
    data,
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceEmployees(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  return employee;
}

export async function deleteEmployee(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // First, get the employee to check if they have a linked user account
  const employee = await prisma.employee.findFirst({
    where: { id, practiceId: practice.id },
    select: { userId: true },
  });

  if (!employee) throw new Error("Employee not found");

  // Use a transaction to delete employee, associated user, and cancel invitations
  await prisma.$transaction(async (tx) => {
    // Cancel any pending invitations for this employee
    await tx.teamInvitation.updateMany({
      where: {
        employeeId: id,
        status: "PENDING",
      },
      data: { status: "CANCELLED" },
    });

    // Delete the employee (this will cascade delete related records)
    await tx.employee.delete({
      where: { id, practiceId: practice.id },
    });

    // If employee had a linked user account, delete it
    if (employee.userId) {
      await tx.user.delete({
        where: { id: employee.userId },
      });
    }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceEmployees(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/employees");
  revalidatePath("/team"); // Also revalidate team page
}

// =============================================================================
// EMPLOYEE DOCUMENTS
// =============================================================================

export async function addEmployeeDocument(data: {
  employeeId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  expiryDate?: Date;
  isSigned?: boolean;
  notes?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  const doc = await prisma.employeeDocument.create({
    data: {
      id: generateId(),
      employeeId: data.employeeId,
      documentType: data.documentType,
      title: data.title,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      expiryDate: data.expiryDate,
      isSigned: data.isSigned || false,
      notes: data.notes,
      uploadedById: user.id,
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/employees/${data.employeeId}`);
  return doc;
}

export async function deleteEmployeeDocument(id: string, employeeId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  await prisma.employeeDocument.delete({
    where: { id },
  });

  revalidatePath(`/employees/${employeeId}`);
}

// =============================================================================
// PROFESSIONAL REGISTRATIONS
// =============================================================================

export async function addRegistration(data: {
  employeeId: string;
  professionalBody: ProfessionalBody;
  registrationNumber: string;
  expiryDate?: Date;
  certificateUrl?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  const registration = await prisma.professionalRegistration.create({
    data: {
      id: generateId(),
      employeeId: data.employeeId,
      professionalBody: data.professionalBody,
      registrationNumber: data.registrationNumber,
      expiryDate: data.expiryDate,
      certificateUrl: data.certificateUrl,
      updatedAt: new Date(),
    },
  });

  // Also update the quick-access fields on employee
  const updateData: Record<string, unknown> = {};
  if (data.professionalBody === "HPCSA") {
    updateData.hpcsaNumber = data.registrationNumber;
    updateData.hpcsaExpiry = data.expiryDate;
  } else if (data.professionalBody === "SANC") {
    updateData.sancNumber = data.registrationNumber;
    updateData.sancExpiry = data.expiryDate;
  } else if (data.professionalBody === "SAPC") {
    updateData.sapcNumber = data.registrationNumber;
    updateData.sapcExpiry = data.expiryDate;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.employee.update({
      where: { id: data.employeeId },
      data: updateData,
    });
  }

  revalidatePath(`/employees/${data.employeeId}`);
  return registration;
}

// =============================================================================
// LEAVE MANAGEMENT
// =============================================================================

export async function getLeaveRequests(filter?: {
  employeeId?: string;
  status?: LeaveStatus;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const where: Record<string, unknown> = {};

  if (filter?.employeeId) {
    where.employeeId = filter.employeeId;
  } else {
    // Only show leave for employees in this practice
    where.Employee = { practiceId: practice.id };
  }

  if (filter?.status) where.status = filter.status;

  return await prisma.leaveRequest.findMany({
    where,
    include: {
      Employee: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createLeaveRequest(data: {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string;
  sickNoteUrl?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      id: generateId(),
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
      sickNoteUrl: data.sickNoteUrl,
      sickNoteUploaded: !!data.sickNoteUrl,
      status: "PENDING",
      updatedAt: new Date(),
    },
  });

  // Notify practice owners about the new leave request
  const leaveTypeDisplay = data.leaveType.replace(/_/g, " ").toLowerCase();
  const startDateStr = data.startDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  const endDateStr = data.endDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  await notifyPracticeOwners({
    practiceId: practice.id,
    alertType: "LEAVE_REQUEST",
    message: `${employee.fullName} has submitted a ${leaveTypeDisplay} leave request for ${data.totalDays} day(s) from ${startDateStr} to ${endDateStr}. Please review and approve or decline.`,
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.practiceEmployees(practice.id));

  revalidatePath("/employees");
  revalidatePath(`/employees/${data.employeeId}`);
  revalidatePath("/leave");
  revalidatePath("/notifications");
  return leaveRequest;
}

export async function approveLeaveRequest(id: string) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: { id },
    include: { Employee: true },
  });

  if (!leaveRequest || leaveRequest.Employee.practiceId !== practice.id) {
    throw new Error("Leave request not found");
  }

  // Deduct from leave balance
  const balanceField =
    leaveRequest.leaveType === "ANNUAL"
      ? "annualLeaveBalance"
      : leaveRequest.leaveType === "SICK"
      ? "sickLeaveBalance"
      : leaveRequest.leaveType === "FAMILY_RESPONSIBILITY"
      ? "familyLeaveBalance"
      : null;

  if (balanceField) {
    await prisma.employee.update({
      where: { id: leaveRequest.employeeId },
      data: {
        [balanceField]: {
          decrement: leaveRequest.totalDays,
        },
      },
    });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvedAt: new Date(),
    },
  });

  // Notify the employee if they have a user account linked
  if (leaveRequest.Employee.userId) {
    const { createAlert } = await import("./alerts");
    const leaveTypeDisplay = leaveRequest.leaveType.replace(/_/g, " ").toLowerCase();
    const startDateStr = leaveRequest.startDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
    const endDateStr = leaveRequest.endDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

    await createAlert({
      practiceId: practice.id,
      recipientId: leaveRequest.Employee.userId,
      alertType: "LEAVE_APPROVED",
      message: `Your ${leaveTypeDisplay} leave request from ${startDateStr} to ${endDateStr} has been approved.`,
    });
  }

  // Invalidate caches
  await invalidateCache(cacheKeys.practiceEmployees(practice.id));

  revalidatePath("/employees");
  revalidatePath(`/employees/${leaveRequest.employeeId}`);
  revalidatePath("/leave");
  revalidatePath("/notifications");
  return updated;
}

export async function declineLeaveRequest(id: string, reason: string) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: { id },
    include: { Employee: true },
  });

  if (!leaveRequest || leaveRequest.Employee.practiceId !== practice.id) {
    throw new Error("Leave request not found");
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "DECLINED",
      approvedById: user.id,
      approvedAt: new Date(),
      declineReason: reason,
    },
  });

  // Notify the employee if they have a user account linked
  if (leaveRequest.Employee.userId) {
    const { createAlert } = await import("./alerts");
    const leaveTypeDisplay = leaveRequest.leaveType.replace(/_/g, " ").toLowerCase();
    const startDateStr = leaveRequest.startDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
    const endDateStr = leaveRequest.endDate.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

    await createAlert({
      practiceId: practice.id,
      recipientId: leaveRequest.Employee.userId,
      alertType: "LEAVE_DECLINED",
      message: `Your ${leaveTypeDisplay} leave request from ${startDateStr} to ${endDateStr} has been declined. Reason: ${reason}`,
    });
  }

  // Invalidate caches
  await invalidateCache(cacheKeys.practiceEmployees(practice.id));

  revalidatePath("/employees");
  revalidatePath(`/employees/${leaveRequest.employeeId}`);
  revalidatePath("/leave");
  revalidatePath("/notifications");
  return updated;
}

// =============================================================================
// WARNINGS & DISCIPLINARY
// =============================================================================

export async function getWarnings(filter?: {
  employeeId?: string;
  isActive?: boolean;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const where: Record<string, unknown> = {};

  if (filter?.employeeId) {
    where.employeeId = filter.employeeId;
  } else {
    where.Employee = { practiceId: practice.id };
  }

  if (filter?.isActive !== undefined) where.isActive = filter.isActive;

  return await prisma.warning.findMany({
    where,
    include: {
      Employee: true,
    },
    orderBy: { issuedAt: "desc" },
  });
}

export async function createWarning(data: {
  employeeId: string;
  warningType: WarningType;
  category: WarningCategory;
  incidentDate: Date;
  description: string;
  documentUrl?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  // Calculate expiry date (6 months from now)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const warning = await prisma.warning.create({
    data: {
      id: generateId(),
      employeeId: data.employeeId,
      warningType: data.warningType,
      category: data.category,
      incidentDate: data.incidentDate,
      description: data.description,
      issuedById: user.id,
      expiresAt,
      documentUrl: data.documentUrl,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${data.employeeId}`);
  return warning;
}

export async function acknowledgeWarning(id: string, comment?: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const warning = await prisma.warning.findFirst({
    where: { id },
    include: { Employee: true },
  });

  if (!warning || warning.Employee.practiceId !== practice.id) {
    throw new Error("Warning not found");
  }

  const updated = await prisma.warning.update({
    where: { id },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      employeeComment: comment,
    },
  });

  revalidatePath(`/employees/${warning.employeeId}`);
  return updated;
}

export async function deleteWarning(id: string, employeeId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  // Verify warning belongs to this employee
  const warning = await prisma.warning.findFirst({
    where: { id, employeeId },
  });
  if (!warning) throw new Error("Warning not found");

  await prisma.warning.delete({
    where: { id },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
}

// =============================================================================
// TRAINING & CERTIFICATIONS
// =============================================================================

export async function getTrainings(filter?: {
  employeeId?: string;
  expiringSoon?: boolean;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const where: Record<string, unknown> = {};

  if (filter?.employeeId) {
    where.employeeId = filter.employeeId;
  } else {
    where.Employee = { practiceId: practice.id };
  }

  if (filter?.expiringSoon) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    where.expiryDate = {
      lte: thirtyDaysFromNow,
      gte: new Date(),
    };
  }

  return await prisma.employeeTraining.findMany({
    where,
    include: {
      Employee: true,
    },
    orderBy: { expiryDate: "asc" },
  });
}

export async function addTraining(data: {
  employeeId: string;
  trainingName: string;
  trainingModuleId?: string;
  provider?: string;
  completedDate: Date;
  expiryDate?: Date;
  status?: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "EXPIRED";
  score?: number;
  cpdPoints?: number;
  certificateUrl?: string;
  certificateNumber?: string;
  notes?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  const training = await prisma.employeeTraining.create({
    data: {
      employeeId: data.employeeId,
      trainingModuleId: data.trainingModuleId,
      trainingName: data.trainingName,
      provider: data.provider,
      completedDate: data.completedDate,
      expiryDate: data.expiryDate,
      status: data.status || "COMPLETED",
      score: data.score,
      cpdPoints: data.cpdPoints,
      certificateUrl: data.certificateUrl,
      certificateNumber: data.certificateNumber,
      notes: data.notes,
      year: data.completedDate.getFullYear(),
    },
  });

  // Update BLS expiry if this is BLS training
  if (data.trainingName.toLowerCase().includes("bls") && data.expiryDate) {
    await prisma.employee.update({
      where: { id: data.employeeId },
      data: { blsExpiry: data.expiryDate },
    });
  }

  revalidatePath("/employees");
  revalidatePath(`/employees/${data.employeeId}`);
  revalidatePath("/training");
  return training;
}

export async function deleteTraining(id: string, employeeId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  await prisma.employeeTraining.delete({
    where: { id },
  });

  revalidatePath(`/employees/${employeeId}`);
}

// =============================================================================
// STATS & REPORTS
// =============================================================================

export async function getEmployeeStats() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    totalEmployees,
    activeEmployees,
    pendingLeaveRequests,
    activeWarnings,
    expiringRegistrations,
    expiringTrainings,
  ] = await Promise.all([
    prisma.employee.count({ where: { practiceId: practice.id } }),
    prisma.employee.count({ where: { practiceId: practice.id, isActive: true } }),
    prisma.leaveRequest.count({
      where: {
        Employee: { practiceId: practice.id },
        status: "PENDING",
      },
    }),
    prisma.warning.count({
      where: {
        Employee: { practiceId: practice.id },
        isActive: true,
        expiresAt: { gt: now },
      },
    }),
    prisma.professionalRegistration.count({
      where: {
        Employee: { practiceId: practice.id },
        isActive: true,
        expiryDate: { lte: thirtyDaysFromNow, gte: now },
      },
    }),
    prisma.employeeTraining.count({
      where: {
        Employee: { practiceId: practice.id },
        expiryDate: { lte: thirtyDaysFromNow, gte: now },
      },
    }),
  ]);

  return {
    totalEmployees,
    activeEmployees,
    pendingLeaveRequests,
    activeWarnings,
    expiringRegistrations,
    expiringTrainings,
  };
}

// =============================================================================
// KPI MANAGEMENT
// =============================================================================

export async function createKpiReview(data: {
  employeeId: string;
  quarter: number;
  year: number;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });
  if (!employee) throw new Error("Employee not found");

  // Check if review already exists for this quarter
  const existing = await prisma.kpiReview.findFirst({
    where: {
      employeeId: data.employeeId,
      quarter: data.quarter,
      year: data.year,
    },
  });
  if (existing) throw new Error("A review for this quarter already exists");

  const review = await prisma.kpiReview.create({
    data: {
      employeeId: data.employeeId,
      quarter: data.quarter,
      year: data.year,
      status: "DRAFT",
    },
    include: {
      goals: true,
    },
  });

  revalidatePath(`/employees/${data.employeeId}`);
  return review;
}

export async function updateKpiReviewStatus(
  reviewId: string,
  status: KpiReviewStatus
) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const review = await prisma.kpiReview.findFirst({
    where: { id: reviewId },
    include: { Employee: true },
  });

  if (!review || review.Employee.practiceId !== practice.id) {
    throw new Error("Review not found");
  }

  const updated = await prisma.kpiReview.update({
    where: { id: reviewId },
    data: {
      status,
      reviewDate: status === "COMPLETED" ? new Date() : undefined,
      reviewedById: status === "COMPLETED" ? user.id : undefined,
    },
  });

  revalidatePath(`/employees/${review.employeeId}`);
  return updated;
}

export async function addKpiGoal(data: {
  reviewId: string;
  title: string;
  description?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const review = await prisma.kpiReview.findFirst({
    where: { id: data.reviewId },
    include: { Employee: true },
  });

  if (!review || review.Employee.practiceId !== practice.id) {
    throw new Error("Review not found");
  }

  const goal = await prisma.kpiGoal.create({
    data: {
      reviewId: data.reviewId,
      title: data.title,
      description: data.description,
    },
  });

  revalidatePath(`/employees/${review.employeeId}`);
  return goal;
}

export async function updateKpiGoal(
  goalId: string,
  data: {
    title?: string;
    description?: string;
    isMet?: boolean | null;
    notes?: string;
  }
) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const goal = await prisma.kpiGoal.findFirst({
    where: { id: goalId },
    include: { review: { include: { Employee: true } } },
  });

  if (!goal || goal.review.Employee.practiceId !== practice.id) {
    throw new Error("Goal not found");
  }

  const updated = await prisma.kpiGoal.update({
    where: { id: goalId },
    data: {
      title: data.title,
      description: data.description,
      isMet: data.isMet,
      notes: data.notes,
      markedAt: data.isMet !== undefined ? new Date() : undefined,
      markedById: data.isMet !== undefined ? user.id : undefined,
    },
  });

  revalidatePath(`/employees/${goal.review.employeeId}`);
  return updated;
}

export async function deleteKpiGoal(goalId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const goal = await prisma.kpiGoal.findFirst({
    where: { id: goalId },
    include: { review: { include: { Employee: true } } },
  });

  if (!goal || goal.review.Employee.practiceId !== practice.id) {
    throw new Error("Goal not found");
  }

  await prisma.kpiGoal.delete({
    where: { id: goalId },
  });

  revalidatePath(`/employees/${goal.review.employeeId}`);
}

export async function deleteKpiReview(reviewId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const review = await prisma.kpiReview.findFirst({
    where: { id: reviewId },
    include: { Employee: true },
  });

  if (!review || review.Employee.practiceId !== practice.id) {
    throw new Error("Review not found");
  }

  await prisma.kpiReview.delete({
    where: { id: reviewId },
  });

  revalidatePath(`/employees/${review.employeeId}`);
}
