"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

// Types for empty fallback data
type TrainingModuleWithCount = {
  id: string;
  name: string;
  description: string | null;
  provider: string | null;
  cpdPoints: number | null;
  validityMonths: number | null;
  isRequired: boolean;
  isActive: boolean;
  practiceId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    EmployeeTrainings: number;
    PositionRequirements: number;
  };
};

type PositionRequirement = {
  id: string;
  trainingModuleId: string;
  position: string;
  isRequired: boolean;
  practiceId: string;
  createdAt: Date;
  updatedAt: Date;
  TrainingModule: { id: string; name: string };
};

type RecentTraining = {
  id: string;
  employeeId: string;
  trainingModuleId: string | null;
  trainingName: string;
  provider: string | null;
  completedDate: Date;
  expiryDate: Date | null;
  status: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "EXPIRED";
  score: number | null;
  cpdPoints: number | null;
  certificateUrl: string | null;
  certificateNumber: string | null;
  notes: string | null;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  Employee: { id: string; fullName: string; position: string };
  TrainingModule: { id: string; name: string } | null;
};

// Default empty data for error fallback
const emptyTrainingPageData = {
  modules: [] as TrainingModuleWithCount[],
  positions: [] as string[],
  positionRequirements: {} as Record<string, PositionRequirement[]>,
  recentTrainings: [] as RecentTraining[],
  stats: {
    totalModules: 0,
    activeModules: 0,
    totalRecords: 0,
    completedThisYear: 0,
    expiringRecords: 0,
    totalCpdPointsThisYear: 0,
  }
};

// ============= Training Modules =============

// Get all training modules for the practice
export const getTrainingModules = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.trainingModule.findMany({
    where: { practiceId: practice.id },
    include: {
      PositionRequirements: true,
      _count: { select: { EmployeeTrainings: true } }
    },
    orderBy: { name: "asc" }
  });
});

// Get active training modules only
export const getActiveTrainingModules = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.trainingModule.findMany({
    where: { practiceId: practice.id, isActive: true },
    orderBy: { name: "asc" }
  });
});

// Create a new training module
export async function createTrainingModule(data: {
  name: string;
  description?: string;
  provider?: string;
  cpdPoints?: number;
  validityMonths?: number;
  isRequired?: boolean;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const module = await prisma.trainingModule.create({
    data: {
      practiceId: practice.id,
      name: data.name,
      description: data.description,
      provider: data.provider,
      cpdPoints: data.cpdPoints,
      validityMonths: data.validityMonths,
      isRequired: data.isRequired ?? true,
    }
  });

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceTraining(practice.id));

  revalidatePath("/training");
  return module;
}

// Update training module
export async function updateTrainingModule(id: string, data: {
  name?: string;
  description?: string;
  provider?: string;
  cpdPoints?: number;
  validityMonths?: number;
  isRequired?: boolean;
  isActive?: boolean;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const module = await prisma.trainingModule.update({
    where: { id, practiceId: practice.id },
    data
  });

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceTraining(practice.id));

  revalidatePath("/training");
  return module;
}

// Delete training module (soft delete by setting isActive = false)
export async function deleteTrainingModule(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  await prisma.trainingModule.update({
    where: { id, practiceId: practice.id },
    data: { isActive: false }
  });

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceTraining(practice.id));

  revalidatePath("/training");
}

// ============= Position Requirements =============

// Get all positions with their required trainings
export const getPositionRequirements = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const requirements = await prisma.positionTrainingRequirement.findMany({
    where: { practiceId: practice.id },
    include: { TrainingModule: true },
    orderBy: [{ position: "asc" }, { TrainingModule: { name: "asc" } }]
  });

  // Group by position
  const grouped = requirements.reduce((acc, req) => {
    if (!acc[req.position]) {
      acc[req.position] = [];
    }
    acc[req.position].push(req);
    return acc;
  }, {} as Record<string, typeof requirements>);

  return grouped;
});

// Get unique positions in the practice
export const getPositions = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const employees = await prisma.employee.findMany({
    where: { practiceId: practice.id },
    select: { position: true },
    distinct: ["position"]
  });

  return employees.map(e => e.position).filter(Boolean);
});

// Set training requirements for a position
export async function setPositionRequirements(
  position: string,
  trainingModuleIds: string[],
  requiredStatus: Record<string, boolean> = {}
) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Delete existing requirements for this position
  await prisma.positionTrainingRequirement.deleteMany({
    where: { practiceId: practice.id, position }
  });

  // Create new requirements
  if (trainingModuleIds.length > 0) {
    await prisma.positionTrainingRequirement.createMany({
      data: trainingModuleIds.map(moduleId => ({
        practiceId: practice.id,
        position,
        trainingModuleId: moduleId,
        isRequired: requiredStatus[moduleId] ?? true
      }))
    });
  }

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceTraining(practice.id));

  revalidatePath("/training");
}

// ============= Employee Training Records =============

// Get all training records for an employee
export const getEmployeeTrainings = cache(async (employeeId: string) => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.employeeTraining.findMany({
    where: {
      employeeId,
      Employee: { practiceId: practice.id }
    },
    include: { TrainingModule: true },
    orderBy: { completedDate: "desc" }
  });
});

// Get employee CPD summary by year
export const getEmployeeCpdSummary = cache(async (employeeId: string, year?: number) => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const targetYear = year ?? new Date().getFullYear();

  const trainings = await prisma.employeeTraining.findMany({
    where: {
      employeeId,
      year: targetYear,
      Employee: { practiceId: practice.id }
    },
    include: { TrainingModule: true },
    orderBy: { completedDate: "desc" }
  });

  const totalCpdPoints = trainings.reduce((sum, t) => sum + (t.cpdPoints || 0), 0);
  const completedCount = trainings.filter(t => t.status === "COMPLETED").length;
  const failedCount = trainings.filter(t => t.status === "FAILED").length;
  const inProgressCount = trainings.filter(t => t.status === "IN_PROGRESS").length;

  return {
    year: targetYear,
    trainings,
    totalCpdPoints,
    completedCount,
    failedCount,
    inProgressCount,
    totalCount: trainings.length
  };
});

// Get training compliance for an employee (required vs completed)
export const getEmployeeTrainingCompliance = cache(async (employeeId: string) => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  // Get employee position
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id }
  });

  if (!employee) return null;

  // Get required trainings for this position
  const requirements = await prisma.positionTrainingRequirement.findMany({
    where: { practiceId: practice.id, position: employee.position },
    include: { TrainingModule: true }
  });

  // Get completed trainings
  const completedTrainings = await prisma.employeeTraining.findMany({
    where: {
      employeeId,
      status: "COMPLETED",
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } }
      ]
    },
    include: { TrainingModule: true }
  });

  const completedModuleIds = new Set(completedTrainings.map(t => t.trainingModuleId).filter(Boolean));

  const compliance = requirements.map(req => ({
    module: req.TrainingModule,
    isRequired: req.isRequired,
    isCompleted: completedModuleIds.has(req.trainingModuleId),
    completedTraining: completedTrainings.find(t => t.trainingModuleId === req.trainingModuleId)
  }));

  const requiredCompleted = compliance.filter(c => c.isRequired && c.isCompleted).length;
  const requiredTotal = compliance.filter(c => c.isRequired).length;

  return {
    employee,
    compliance,
    requiredCompleted,
    requiredTotal,
    compliancePercentage: requiredTotal > 0 ? Math.round((requiredCompleted / requiredTotal) * 100) : 100
  };
});

// Create employee training record
export async function createEmployeeTraining(data: {
  employeeId: string;
  trainingModuleId?: string;
  trainingName: string;
  provider?: string;
  completedDate: Date;
  expiryDate?: Date | null;
  status?: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "EXPIRED";
  score?: number;
  cpdPoints?: number;
  certificateUrl?: string;
  certificateNumber?: string;
  notes?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id }
  });

  if (!employee) throw new Error("Employee not found");

  // If training module provided, get default values
  let trainingName = data.trainingName;
  let cpdPoints = data.cpdPoints;
  let provider = data.provider;
  let expiryDate = data.expiryDate;

  if (data.trainingModuleId) {
    const module = await prisma.trainingModule.findFirst({
      where: { id: data.trainingModuleId, practiceId: practice.id }
    });
    if (module) {
      trainingName = trainingName || module.name;
      cpdPoints = cpdPoints ?? module.cpdPoints ?? undefined;
      provider = provider || module.provider || undefined;
      if (!expiryDate && module.validityMonths) {
        const expiry = new Date(data.completedDate);
        expiry.setMonth(expiry.getMonth() + module.validityMonths);
        expiryDate = expiry;
      }
    }
  }

  const training = await prisma.employeeTraining.create({
    data: {
      employeeId: data.employeeId,
      trainingModuleId: data.trainingModuleId,
      trainingName,
      provider,
      completedDate: data.completedDate,
      expiryDate,
      status: data.status || "COMPLETED",
      score: data.score,
      cpdPoints,
      certificateUrl: data.certificateUrl,
      certificateNumber: data.certificateNumber,
      notes: data.notes,
      year: data.completedDate.getFullYear()
    }
  });

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceTraining(practice.id));

  revalidatePath("/training");
  revalidatePath(`/employees/${data.employeeId}`);
  return training;
}

// Update employee training record
export async function updateEmployeeTraining(id: string, data: {
  trainingName?: string;
  provider?: string;
  completedDate?: Date;
  expiryDate?: Date | null;
  status?: "COMPLETED" | "FAILED" | "IN_PROGRESS" | "EXPIRED";
  score?: number;
  cpdPoints?: number;
  certificateUrl?: string;
  certificateNumber?: string;
  notes?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Verify training belongs to practice employee
  const existing = await prisma.employeeTraining.findFirst({
    where: { id },
    include: { Employee: true }
  });

  if (!existing || existing.Employee.practiceId !== practice.id) {
    throw new Error("Training record not found");
  }

  // Update year if completedDate changes
  const updateData: Record<string, unknown> = { ...data };
  if (data.completedDate) {
    updateData.year = data.completedDate.getFullYear();
  }

  const training = await prisma.employeeTraining.update({
    where: { id },
    data: updateData
  });

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceTraining(practice.id));

  revalidatePath("/training");
  revalidatePath(`/employees/${existing.employeeId}`);
  return training;
}

// Delete employee training record
export async function deleteEmployeeTraining(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const training = await prisma.employeeTraining.findFirst({
    where: { id },
    include: { Employee: true }
  });

  if (!training || training.Employee.practiceId !== practice.id) {
    throw new Error("Training record not found");
  }

  await prisma.employeeTraining.delete({ where: { id } });

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceTraining(practice.id));

  revalidatePath("/training");
  revalidatePath(`/employees/${training.employeeId}`);
}

// ============= Training Page Data =============

// Optimized: Single auth call + parallel queries for training page with Redis caching
export async function getTrainingPageData() {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return getCachedData(
    cacheKeys.practiceTraining(practice.id),
    async () => {
      const currentYear = new Date().getFullYear();
      const now = new Date();

  const [
    modules,
    positions,
    positionRequirements,
    recentTrainings,
    stats
  ] = await Promise.all([
    // Training modules
    prisma.trainingModule.findMany({
      where: { practiceId: practice.id },
      include: {
        _count: { select: { EmployeeTrainings: true, PositionRequirements: true } }
      },
      orderBy: { name: "asc" }
    }),
    // Unique positions
    prisma.employee.findMany({
      where: { practiceId: practice.id, isActive: true },
      select: { position: true },
      distinct: ["position"]
    }),
    // Position requirements
    prisma.positionTrainingRequirement.findMany({
      where: { practiceId: practice.id },
      include: { TrainingModule: { select: { id: true, name: true } } },
      orderBy: { position: "asc" }
    }),
    // Recent trainings (last 20)
    prisma.employeeTraining.findMany({
      where: { Employee: { practiceId: practice.id } },
      include: {
        Employee: { select: { id: true, fullName: true, position: true } },
        TrainingModule: { select: { id: true, name: true } }
      },
      orderBy: { completedDate: "desc" },
      take: 20
    }),
    // Aggregated stats
    prisma.$queryRaw<[{
      totalModules: bigint;
      activeModules: bigint;
      totalRecords: bigint;
      completedThisYear: bigint;
      expiringRecords: bigint;
      totalCpdPoints: bigint | null;
    }]>`
      SELECT
        (SELECT COUNT(*) FROM "TrainingModule" WHERE "practiceId" = ${practice.id}) as "totalModules",
        (SELECT COUNT(*) FROM "TrainingModule" WHERE "practiceId" = ${practice.id} AND "isActive" = true) as "activeModules",
        (SELECT COUNT(*) FROM "EmployeeTraining" et JOIN "Employee" e ON et."employeeId" = e.id WHERE e."practiceId" = ${practice.id}) as "totalRecords",
        (SELECT COUNT(*) FROM "EmployeeTraining" et JOIN "Employee" e ON et."employeeId" = e.id WHERE e."practiceId" = ${practice.id} AND et.year = ${currentYear} AND et.status = 'COMPLETED') as "completedThisYear",
        (SELECT COUNT(*) FROM "EmployeeTraining" et JOIN "Employee" e ON et."employeeId" = e.id WHERE e."practiceId" = ${practice.id} AND et."expiryDate" IS NOT NULL AND et."expiryDate" > ${now} AND et."expiryDate" <= ${new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)}) as "expiringRecords",
        (SELECT SUM(et."cpdPoints") FROM "EmployeeTraining" et JOIN "Employee" e ON et."employeeId" = e.id WHERE e."practiceId" = ${practice.id} AND et.year = ${currentYear}) as "totalCpdPoints"
    `
  ]);

  // Group position requirements
  const groupedRequirements = positionRequirements.reduce((acc, req) => {
    if (!acc[req.position]) acc[req.position] = [];
    acc[req.position].push(req);
    return acc;
  }, {} as Record<string, typeof positionRequirements>);

      const s = stats[0];
      return {
        modules,
        positions: positions.map(p => p.position),
        positionRequirements: groupedRequirements,
        recentTrainings,
        stats: {
          totalModules: Number(s?.totalModules || 0),
          activeModules: Number(s?.activeModules || 0),
          totalRecords: Number(s?.totalRecords || 0),
          completedThisYear: Number(s?.completedThisYear || 0),
          expiringRecords: Number(s?.expiringRecords || 0),
          totalCpdPointsThisYear: Number(s?.totalCpdPoints || 0)
        }
      };
    },
    CACHE_DURATIONS.SHORT // 1 minute
    );
  } catch (error) {
    console.error("Training page data fetch error:", error);
    return emptyTrainingPageData;
  }
}

// Get all employees with their training compliance - optimized with parallel queries
export const getEmployeesTrainingOverview = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  // Parallel fetch: employees AND requirements at the same time
  const [employees, requirements] = await Promise.all([
    prisma.employee.findMany({
      where: { practiceId: practice.id, isActive: true },
      select: {
        id: true,
        fullName: true,
        position: true,
        EmployeeTraining: {
          where: { status: "COMPLETED" },
          select: { id: true, trainingModuleId: true, expiryDate: true }
        }
      },
      orderBy: { fullName: "asc" }
    }),
    prisma.positionTrainingRequirement.findMany({
      where: { practiceId: practice.id, isRequired: true },
      select: { position: true, trainingModuleId: true }
    })
  ]);

  // Group requirements by position
  const reqByPosition = requirements.reduce((acc, req) => {
    if (!acc[req.position]) acc[req.position] = [];
    acc[req.position].push(req.trainingModuleId);
    return acc;
  }, {} as Record<string, string[]>);

  const now = new Date();

  return employees.map(emp => {
    const requiredModuleIds = reqByPosition[emp.position] || [];
    const validTrainings = emp.EmployeeTraining.filter(t =>
      t.trainingModuleId &&
      (!t.expiryDate || t.expiryDate > now)
    );
    const completedModuleIds = new Set(validTrainings.map(t => t.trainingModuleId));

    const completed = requiredModuleIds.filter(id => completedModuleIds.has(id)).length;
    const total = requiredModuleIds.length;

    return {
      id: emp.id,
      fullName: emp.fullName,
      position: emp.position,
      completedRequired: completed,
      totalRequired: total,
      compliancePercentage: total > 0 ? Math.round((completed / total) * 100) : 100,
      totalTrainings: emp.EmployeeTraining.length
    };
  });
});
