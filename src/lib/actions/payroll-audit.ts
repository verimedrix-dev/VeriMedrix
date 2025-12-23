"use server";

import { prisma } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";

export async function getPayrollAuditLogs() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.payrollAuditLog.findMany({
    where: {
      PayrollRun: {
        practiceId: practice.id,
      },
    },
    include: {
      Employee: {
        select: {
          fullName: true,
          employeeNumber: true,
        },
      },
    },
    orderBy: {
      calculationTimestamp: "desc",
    },
    take: 100, // Limit to recent 100 logs
  });
}

export async function getAuditLogDetails(logId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const log = await prisma.payrollAuditLog.findFirst({
    where: {
      id: logId,
      PayrollRun: {
        practiceId: practice.id,
      },
    },
    include: {
      Employee: {
        select: {
          fullName: true,
          employeeNumber: true,
          taxNumber: true,
        },
      },
      PayrollRun: {
        select: {
          month: true,
          year: true,
        },
      },
    },
  });

  if (!log) {
    throw new Error("Audit log not found");
  }

  return log;
}
