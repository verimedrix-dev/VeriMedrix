"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { LocumSourceType, TimesheetStatus, PaymentStatus } from "@prisma/client";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

// Default empty data for error fallback
const emptyLocumsData = {
  locums: [],
  stats: {
    totalLocums: 0,
    activeLocums: 0,
    currentlyWorking: 0,
    expiringCredentials: 0,
    monthlyHours: 0,
    monthlyPayable: 0,
    pendingApproval: 0,
  },
};

// =============================================================================
// LOCUM CRUD
// =============================================================================

// Optimized: Get locums page data with Redis caching
export async function getLocumsPageData() {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return getCachedData(
    cacheKeys.practiceLocums(practice.id),
    async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [locums, stats] = await Promise.all([
        prisma.locum.findMany({
          where: { practiceId: practice.id },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            sourceType: true,
            agencyName: true,
            hourlyRate: true,
            hpcsaNumber: true,
            hpcsaExpiry: true,
            indemnityInsuranceExpiry: true,
            isActive: true,
            LocumTimesheet: {
              where: { status: "CLOCKED_IN" },
              select: { id: true, clockIn: true },
              take: 1,
            },
          },
          orderBy: { fullName: "asc" },
        }),
        Promise.all([
          prisma.locum.count({ where: { practiceId: practice.id } }),
          prisma.locum.count({ where: { practiceId: practice.id, isActive: true } }),
          prisma.locumTimesheet.count({
            where: { practiceId: practice.id, status: "CLOCKED_IN" },
          }),
          prisma.locum.count({
            where: {
              practiceId: practice.id,
              isActive: true,
              OR: [
                { hpcsaExpiry: { lte: thirtyDaysFromNow, gte: now } },
                { indemnityInsuranceExpiry: { lte: thirtyDaysFromNow, gte: now } },
              ],
            },
          }),
          prisma.locumTimesheet.aggregate({
            where: {
              practiceId: practice.id,
              date: { gte: startOfMonth, lte: endOfMonth },
              status: { in: ["CLOCKED_OUT", "APPROVED"] },
            },
            _sum: { hoursWorked: true, totalPayable: true },
          }),
          prisma.locumTimesheet.count({
            where: { practiceId: practice.id, status: "CLOCKED_OUT" },
          }),
        ]),
      ]);

      const [totalLocums, activeLocums, currentlyWorking, expiringCredentials, monthlyStats, pendingApproval] = stats;

      return {
        locums,
        stats: {
          totalLocums,
          activeLocums,
          currentlyWorking,
          expiringCredentials,
          monthlyHours: monthlyStats._sum.hoursWorked || 0,
          monthlyPayable: monthlyStats._sum.totalPayable || 0,
          pendingApproval,
        },
      };
    },
    CACHE_DURATIONS.SHORT // 1 minute
    );
  } catch (error) {
    console.error("Locums page data fetch error:", error);
    return emptyLocumsData;
  }
}

// Get all locums for the practice (kept for backward compatibility)
export const getLocums = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.locum.findMany({
    where: { practiceId: practice.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      sourceType: true,
      agencyName: true,
      hourlyRate: true,
      hpcsaNumber: true,
      hpcsaExpiry: true,
      indemnityInsuranceExpiry: true,
      isActive: true,
      LocumTimesheet: {
        where: { status: "CLOCKED_IN" },
        select: { id: true, clockIn: true },
        take: 1,
      },
    },
    orderBy: { fullName: "asc" },
  });
});

// Get locum stats for dashboard (kept for backward compatibility)
export const getLocumStats = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    totalLocums,
    activeLocums,
    currentlyWorking,
    expiringCredentials,
    monthlyStats,
    pendingApproval,
  ] = await Promise.all([
    prisma.locum.count({
      where: { practiceId: practice.id },
    }),
    prisma.locum.count({
      where: { practiceId: practice.id, isActive: true },
    }),
    prisma.locumTimesheet.count({
      where: {
        practiceId: practice.id,
        status: "CLOCKED_IN",
      },
    }),
    prisma.locum.count({
      where: {
        practiceId: practice.id,
        isActive: true,
        OR: [
          { hpcsaExpiry: { lte: thirtyDaysFromNow, gte: now } },
          { indemnityInsuranceExpiry: { lte: thirtyDaysFromNow, gte: now } },
        ],
      },
    }),
    prisma.locumTimesheet.aggregate({
      where: {
        practiceId: practice.id,
        date: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ["CLOCKED_OUT", "APPROVED"] },
      },
      _sum: { hoursWorked: true, totalPayable: true },
    }),
    prisma.locumTimesheet.count({
      where: {
        practiceId: practice.id,
        status: "CLOCKED_OUT",
      },
    }),
  ]);

  return {
    totalLocums,
    activeLocums,
    currentlyWorking,
    expiringCredentials,
    monthlyHours: monthlyStats._sum.hoursWorked || 0,
    monthlyPayable: monthlyStats._sum.totalPayable || 0,
    pendingApproval,
  };
});

// Create a new locum
export async function createLocum(data: {
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  sourceType: LocumSourceType;
  agencyName?: string;
  hourlyRate: number;
  hpcsaNumber?: string;
  hpcsaExpiry?: Date;
  indemnityInsuranceNumber?: string;
  indemnityInsuranceExpiry?: Date;
  notes?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const locum = await prisma.locum.create({
    data: {
      practiceId: practice.id,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      idNumber: data.idNumber,
      sourceType: data.sourceType,
      agencyName: data.agencyName,
      hourlyRate: data.hourlyRate,
      hpcsaNumber: data.hpcsaNumber,
      hpcsaExpiry: data.hpcsaExpiry,
      indemnityInsuranceNumber: data.indemnityInsuranceNumber,
      indemnityInsuranceExpiry: data.indemnityInsuranceExpiry,
      notes: data.notes,
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceLocums(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/locums");
  return locum;
}

// Update a locum
export async function updateLocum(
  id: string,
  data: {
    fullName?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    sourceType?: LocumSourceType;
    agencyName?: string;
    hourlyRate?: number;
    hpcsaNumber?: string;
    hpcsaExpiry?: Date;
    indemnityInsuranceNumber?: string;
    indemnityInsuranceExpiry?: Date;
    notes?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return { success: false, error: "Not authenticated" };

    const existing = await prisma.locum.findFirst({
      where: { id, practiceId: practice.id },
    });
    if (!existing) return { success: false, error: "Locum not found" };

    await prisma.locum.update({
      where: { id },
      data,
    });

    // Invalidate caches
    await Promise.all([
      invalidateCache(cacheKeys.practiceLocums(practice.id)),
      invalidateCache(cacheKeys.practiceDashboard(practice.id)),
    ]);

    revalidatePath("/locums");
    revalidatePath(`/locums/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating locum:", error);
    return { success: false, error: "Failed to update locum" };
  }
}

// Get a single locum with details
export const getLocum = cache(async (id: string) => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return await prisma.locum.findFirst({
    where: { id, practiceId: practice.id },
    include: {
      LocumDocument: {
        orderBy: { createdAt: "desc" },
      },
      LocumTimesheet: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });
});

// Delete a locum
export async function deleteLocum(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const existing = await prisma.locum.findFirst({
    where: { id, practiceId: practice.id },
  });
  if (!existing) throw new Error("Locum not found");

  await prisma.locum.delete({ where: { id } });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceLocums(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/locums");
}

// =============================================================================
// TIMESHEET / CLOCK IN-OUT
// =============================================================================

// Clock in a locum
export async function clockIn(locumId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const locum = await prisma.locum.findFirst({
    where: { id: locumId, practiceId: practice.id },
  });
  if (!locum) throw new Error("Locum not found");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if already clocked in today
  const existing = await prisma.locumTimesheet.findUnique({
    where: { locumId_date: { locumId, date: today } },
  });

  if (existing) {
    if (existing.status === "CLOCKED_IN") {
      throw new Error("Already clocked in");
    }
    throw new Error("Already have a timesheet for today");
  }

  const timesheet = await prisma.locumTimesheet.create({
    data: {
      locumId,
      practiceId: practice.id,
      date: today,
      clockIn: now,
      hourlyRate: locum.hourlyRate,
      status: "CLOCKED_IN",
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceLocums(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/locums");
  revalidatePath("/locums/clock");
  revalidatePath("/locums/timesheets");
  return timesheet;
}

// Clock out a locum
export async function clockOut(locumId: string, breakMinutes?: number) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const timesheet = await prisma.locumTimesheet.findUnique({
    where: { locumId_date: { locumId, date: today } },
  });

  if (!timesheet) throw new Error("No timesheet found for today");
  if (timesheet.status !== "CLOCKED_IN") throw new Error("Not currently clocked in");
  if (!timesheet.clockIn) throw new Error("Invalid timesheet state");

  const clockOut = now;
  const breakMins = breakMinutes || 0;

  // Calculate hours worked
  const totalMinutes = (clockOut.getTime() - timesheet.clockIn.getTime()) / (1000 * 60);
  const workMinutes = totalMinutes - breakMins;
  const hoursWorked = Math.round(workMinutes / 60 * 100) / 100; // Round to 2 decimal places

  // Calculate payable
  const totalPayable = Math.round(hoursWorked * timesheet.hourlyRate * 100) / 100;

  const updated = await prisma.locumTimesheet.update({
    where: { id: timesheet.id },
    data: {
      clockOut,
      breakMinutes: breakMins,
      hoursWorked,
      totalPayable,
      status: "CLOCKED_OUT",
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceLocums(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/locums");
  revalidatePath("/locums/clock");
  revalidatePath("/locums/timesheets");
  return updated;
}

// Get current clock status for a locum
export async function getClockStatus(locumId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const timesheet = await prisma.locumTimesheet.findUnique({
    where: { locumId_date: { locumId, date: today } },
  });

  return timesheet;
}

// =============================================================================
// TIMESHEET APPROVAL
// =============================================================================

// Get timesheets pending approval
export const getPendingTimesheets = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.locumTimesheet.findMany({
    where: {
      practiceId: practice.id,
      status: "CLOCKED_OUT",
    },
    include: {
      Locum: {
        select: { id: true, fullName: true, sourceType: true, agencyName: true },
      },
    },
    orderBy: { date: "desc" },
  });
});

// Approve a timesheet
export async function approveTimesheet(timesheetId: string) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const timesheet = await prisma.locumTimesheet.findFirst({
    where: { id: timesheetId, practiceId: practice.id },
  });
  if (!timesheet) throw new Error("Timesheet not found");
  if (timesheet.status !== "CLOCKED_OUT") {
    throw new Error("Can only approve completed timesheets");
  }

  const updated = await prisma.locumTimesheet.update({
    where: { id: timesheetId },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvedAt: new Date(),
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceLocums(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
    invalidateCache(cacheKeys.practicePayroll(practice.id)),
  ]);

  revalidatePath("/locums");
  revalidatePath("/locums/timesheets");
  return updated;
}

// Reject a timesheet
export async function rejectTimesheet(timesheetId: string, reason: string) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const timesheet = await prisma.locumTimesheet.findFirst({
    where: { id: timesheetId, practiceId: practice.id },
  });
  if (!timesheet) throw new Error("Timesheet not found");
  if (timesheet.status !== "CLOCKED_OUT") {
    throw new Error("Can only reject pending timesheets");
  }

  const updated = await prisma.locumTimesheet.update({
    where: { id: timesheetId },
    data: {
      status: "REJECTED",
      rejectedById: user.id,
      rejectedAt: new Date(),
      rejectionNote: reason,
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceLocums(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/locums");
  revalidatePath("/locums/timesheets");
  return updated;
}

// Bulk approve timesheets
export async function bulkApproveTimesheets(timesheetIds: string[]) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  await prisma.locumTimesheet.updateMany({
    where: {
      id: { in: timesheetIds },
      practiceId: practice.id,
      status: "CLOCKED_OUT",
    },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvedAt: new Date(),
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceLocums(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
    invalidateCache(cacheKeys.practicePayroll(practice.id)),
  ]);

  revalidatePath("/locums");
  revalidatePath("/locums/timesheets");
}

// =============================================================================
// PAYMENT REPORTS
// =============================================================================

// Get payment report for a period
export async function getPaymentReport(startDate: Date, endDate: Date) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const timesheets = await prisma.locumTimesheet.findMany({
    where: {
      practiceId: practice.id,
      date: { gte: startDate, lte: endDate },
      status: "APPROVED",
    },
    include: {
      Locum: {
        select: {
          id: true,
          fullName: true,
          sourceType: true,
          agencyName: true,
          hourlyRate: true,
        },
      },
    },
    orderBy: [{ Locum: { fullName: "asc" } }, { date: "asc" }],
  });

  // Group by locum
  const byLocum = timesheets.reduce((acc, ts) => {
    const locumId = ts.locumId;
    if (!acc[locumId]) {
      acc[locumId] = {
        locum: ts.Locum,
        timesheets: [],
        totalHours: 0,
        totalPayable: 0,
      };
    }
    acc[locumId].timesheets.push(ts);
    acc[locumId].totalHours += ts.hoursWorked || 0;
    acc[locumId].totalPayable += ts.totalPayable || 0;
    return acc;
  }, {} as Record<string, { locum: typeof timesheets[0]["Locum"]; timesheets: typeof timesheets; totalHours: number; totalPayable: number }>);

  const summary = {
    totalTimesheets: timesheets.length,
    totalHours: timesheets.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0),
    totalPayable: timesheets.reduce((sum, ts) => sum + (ts.totalPayable || 0), 0),
    directLocums: Object.values(byLocum).filter(l => l.locum.sourceType === "DIRECT"),
    agencyLocums: Object.values(byLocum).filter(l => l.locum.sourceType === "AGENCY"),
  };

  return { byLocum: Object.values(byLocum), summary };
}

// Mark timesheets as paid
export async function markTimesheetsPaid(timesheetIds: string[], paymentRef?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return { success: false, error: "Not authenticated" };

    await prisma.locumTimesheet.updateMany({
      where: {
        id: { in: timesheetIds },
        practiceId: practice.id,
        status: "APPROVED",
      },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        paymentRef,
      },
    });

    // Invalidate caches
    await Promise.all([
      invalidateCache(cacheKeys.practiceLocums(practice.id)),
      invalidateCache(cacheKeys.practiceDashboard(practice.id)),
      invalidateCache(cacheKeys.practicePayroll(practice.id)),
    ]);

    revalidatePath("/locums");
    revalidatePath("/locums/payments");
    return { success: true };
  } catch (error) {
    console.error("Error marking timesheets paid:", error);
    return { success: false, error: "Failed to process payment" };
  }
}

// Get unpaid approved timesheets
export const getUnpaidTimesheets = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.locumTimesheet.findMany({
    where: {
      practiceId: practice.id,
      status: "APPROVED",
      paymentStatus: "UNPAID",
    },
    include: {
      Locum: {
        select: { id: true, fullName: true, sourceType: true, agencyName: true },
      },
    },
    orderBy: { date: "asc" },
  });
});

// =============================================================================
// LOCUM DOCUMENTS
// =============================================================================

export async function addLocumDocument(data: {
  locumId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  expiryDate?: Date;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const locum = await prisma.locum.findFirst({
    where: { id: data.locumId, practiceId: practice.id },
  });
  if (!locum) throw new Error("Locum not found");

  const doc = await prisma.locumDocument.create({
    data: {
      locumId: data.locumId,
      documentType: data.documentType,
      title: data.title,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      expiryDate: data.expiryDate,
      uploadedById: user.id,
    },
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.practiceLocums(practice.id));

  revalidatePath(`/locums/${data.locumId}`);
  return doc;
}

export async function deleteLocumDocument(documentId: string, locumId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const locum = await prisma.locum.findFirst({
    where: { id: locumId, practiceId: practice.id },
  });
  if (!locum) throw new Error("Locum not found");

  await prisma.locumDocument.delete({ where: { id: documentId } });

  // Invalidate caches
  await invalidateCache(cacheKeys.practiceLocums(practice.id));

  revalidatePath(`/locums/${locumId}`);
}
