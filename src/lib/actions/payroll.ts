"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureUserAndPractice } from "./practice";
import type { PayFrequency, UifExemptReason, DeductionType, PayrollStatus, PaymentType } from "@prisma/client";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";
import { calculatePAYE, getCurrentTaxYear } from "@/lib/tax-calculator";

// Default empty data for error fallback
const emptyPayrollData = {
  employees: [],
  currentPayrollRun: null,
  recentPayrollRuns: [],
};

// UIF Constants (South Africa)
const UIF_RATE = 0.01; // 1%
const UIF_CAP = 177.12; // Maximum monthly UIF contribution

// SDL Rate for employer contribution
const SDL_RATE = 0.01; // 1%

// Helper function to calculate UIF amount
function calculateUif(grossSalary: number, isExempt: boolean): number {
  if (isExempt) return 0;
  const uif = grossSalary * UIF_RATE;
  return Math.min(uif, UIF_CAP);
}

// ==================== EMPLOYEE COMPENSATION ====================

// Optimized: Get payroll page data with Redis caching
export async function getPayrollPageData() {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return getCachedData(
    cacheKeys.practicePayroll(practice.id),
    async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const [employees, currentPayrollRun, recentPayrollRuns] = await Promise.all([
        prisma.employee.findMany({
          where: {
            practiceId: practice.id,
            isActive: true,
          },
          include: {
            EmployeeDeduction: {
              where: { isActive: true },
              orderBy: { deductionType: "asc" },
            },
          },
          orderBy: { fullName: "asc" },
        }),
        prisma.payrollRun.findFirst({
          where: {
            practiceId: practice.id,
            month: currentMonth,
            year: currentYear,
          },
          include: {
            PayrollEntry: {
              include: {
                Employee: {
                  select: {
                    id: true,
                    fullName: true,
                    position: true,
                    employeeNumber: true,
                  },
                },
              },
            },
          },
        }),
        prisma.payrollRun.findMany({
          where: {
            practiceId: practice.id,
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 6,
          select: {
            id: true,
            month: true,
            year: true,
            status: true,
            totalGross: true,
            totalNet: true,
            paidAt: true,
          },
        }),
      ]);

      return {
        employees,
        currentPayrollRun,
        recentPayrollRuns,
      };
    },
    CACHE_DURATIONS.SHORT // 1 minute
    );
  } catch (error) {
    console.error("Payroll page data fetch error:", error);
    return emptyPayrollData;
  }
}

export async function getEmployeesWithCompensation() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.employee.findMany({
    where: {
      practiceId: practice.id,
      isActive: true,
    },
    include: {
      EmployeeDeduction: {
        where: { isActive: true },
        orderBy: { deductionType: "asc" },
      },
    },
    orderBy: { fullName: "asc" },
  });
}

export async function getEmployeeCompensation(employeeId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return await prisma.employee.findFirst({
    where: {
      id: employeeId,
      practiceId: practice.id,
    },
    include: {
      EmployeeDeduction: {
        where: { isActive: true },
        orderBy: { deductionType: "asc" },
      },
    },
  });
}

export async function updateEmployeeCompensation(
  employeeId: string,
  data: {
    grossSalary?: number;
    payFrequency?: PayFrequency;
    payDay?: number;
    bankName?: string;
    bankAccountNumber?: string;
    bankBranchCode?: string;
    uifExempt?: boolean;
    uifExemptReason?: UifExemptReason | null;
    taxNumber?: string;
    dateOfBirth?: Date;
    medicalAidDependents?: number;
    retirementContribution?: number;
    payeOverride?: number;
  }
) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id },
  });

  if (!employee) throw new Error("Employee not found");

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practicePayroll(practice.id)),
    invalidateCache(cacheKeys.practiceEmployees(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/payroll");
  revalidatePath(`/employees/${employeeId}`);
}

// ==================== DEDUCTIONS ====================

export async function addEmployeeDeduction(data: {
  employeeId: string;
  deductionType: DeductionType;
  name?: string;
  amount?: number;
  percentage?: number;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });

  if (!employee) throw new Error("Employee not found");

  // For PAYE, UIF - only allow one
  if (data.deductionType === "PAYE" || data.deductionType === "UIF") {
    const existing = await prisma.employeeDeduction.findFirst({
      where: {
        employeeId: data.employeeId,
        deductionType: data.deductionType,
        isActive: true,
      },
    });
    if (existing) {
      throw new Error(`${data.deductionType} deduction already exists for this employee`);
    }
  }

  await prisma.employeeDeduction.create({
    data: {
      employeeId: data.employeeId,
      deductionType: data.deductionType,
      name: data.name,
      amount: data.amount,
      percentage: data.percentage,
    },
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.practicePayroll(practice.id));

  revalidatePath("/payroll");
}

export async function updateEmployeeDeduction(
  deductionId: string,
  data: {
    amount?: number;
    percentage?: number;
    name?: string;
  }
) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const deduction = await prisma.employeeDeduction.findFirst({
    where: { id: deductionId },
    include: { Employee: true },
  });

  if (!deduction || deduction.Employee.practiceId !== practice.id) {
    throw new Error("Deduction not found");
  }

  await prisma.employeeDeduction.update({
    where: { id: deductionId },
    data,
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.practicePayroll(practice.id));

  revalidatePath("/payroll");
}

export async function removeEmployeeDeduction(deductionId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const deduction = await prisma.employeeDeduction.findFirst({
    where: { id: deductionId },
    include: { Employee: true },
  });

  if (!deduction || deduction.Employee.practiceId !== practice.id) {
    throw new Error("Deduction not found");
  }

  await prisma.employeeDeduction.update({
    where: { id: deductionId },
    data: { isActive: false },
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.practicePayroll(practice.id));

  revalidatePath("/payroll");
}

// ==================== PAYROLL RUNS ====================

export async function getPayrollRuns(year?: number) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const currentYear = year || new Date().getFullYear();

  return await prisma.payrollRun.findMany({
    where: {
      practiceId: practice.id,
      year: currentYear,
    },
    include: {
      PayrollEntry: {
        include: {
          Employee: {
            select: {
              id: true,
              fullName: true,
              position: true,
              employeeNumber: true,
            },
          },
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function getPayrollRun(month: number, year: number) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return await prisma.payrollRun.findFirst({
    where: {
      practiceId: practice.id,
      month,
      year,
    },
    include: {
      PayrollEntry: {
        include: {
          Employee: {
            select: {
              id: true,
              fullName: true,
              position: true,
              employeeNumber: true,
              bankName: true,
              bankAccountNumber: true,
              bankBranchCode: true,
            },
          },
          PayrollDeduction: true,
          PayrollAddition: true,
        },
      },
    },
  });
}

export async function createOrUpdatePayrollRun(month: number, year: number) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Get all active employees with compensation data
  const employees = await prisma.employee.findMany({
    where: {
      practiceId: practice.id,
      isActive: true,
      grossSalary: { not: null },
    },
    include: {
      EmployeeDeduction: {
        where: { isActive: true },
      },
    },
  });

  // Check if payroll run exists
  let payrollRun = await prisma.payrollRun.findFirst({
    where: {
      practiceId: practice.id,
      month,
      year,
    },
  });

  // Create or update payroll run
  if (!payrollRun) {
    payrollRun = await prisma.payrollRun.create({
      data: {
        practiceId: practice.id,
        month,
        year,
        status: "DRAFT",
      },
    });
  } else if (payrollRun.status !== "DRAFT") {
    throw new Error("Cannot modify a processed or paid payroll run");
  }

  // Delete existing entries and recreate
  await prisma.payrollEntry.deleteMany({
    where: { payrollRunId: payrollRun.id },
  });

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let totalEmployerUif = 0;
  let totalEmployerSdl = 0;

  // Create entries for each employee
  for (const employee of employees) {
    const grossSalary = employee.grossSalary || 0;

    // Calculate deductions
    let payeAmount = 0;
    let uifAmount = 0;
    let pensionAmount = 0;
    let medicalAidAmount = 0;
    let otherDeductions = 0;
    const deductionDetails: Array<{
      deductionType: DeductionType;
      name: string;
      amount: number;
    }> = [];

    // ENHANCED: Calculate PAYE automatically using SARS tax tables
    try {
      const payeCalculation = await calculatePAYE(employee.id, grossSalary, month, year);
      payeAmount = payeCalculation.monthlyPaye;

      if (payeAmount > 0) {
        deductionDetails.push({
          deductionType: "PAYE",
          name: "PAYE (Tax)",
          amount: payeAmount,
        });
      }
    } catch (error) {
      console.error(`PAYE calculation error for employee ${employee.id}:`, error);
      // Fallback to manual PAYE if calculation fails
      const manualPaye = employee.EmployeeDeduction.find(d => d.deductionType === 'PAYE');
      if (manualPaye) {
        payeAmount = manualPaye.amount || 0;
        if (payeAmount > 0) {
          deductionDetails.push({
            deductionType: "PAYE",
            name: "PAYE (Tax - Manual)",
            amount: payeAmount,
          });
        }
      }
    }

    for (const deduction of employee.EmployeeDeduction) {
      let amount = 0;

      switch (deduction.deductionType) {
        case "PAYE":
          // Skip - already calculated above with automated PAYE
          break;

        case "UIF":
          // UIF is auto-calculated, but only if not exempt
          amount = calculateUif(grossSalary, employee.uifExempt);
          uifAmount = amount;
          if (amount > 0) {
            deductionDetails.push({
              deductionType: "UIF",
              name: "UIF",
              amount,
            });
          }
          break;

        case "PENSION":
          // Can be percentage or fixed amount
          if (deduction.percentage) {
            amount = grossSalary * (deduction.percentage / 100);
          } else {
            amount = deduction.amount || 0;
          }
          pensionAmount = amount;
          if (amount > 0) {
            deductionDetails.push({
              deductionType: "PENSION",
              name: "Pension Fund",
              amount,
            });
          }
          break;

        case "MEDICAL_AID":
          amount = deduction.amount || 0;
          medicalAidAmount = amount;
          if (amount > 0) {
            deductionDetails.push({
              deductionType: "MEDICAL_AID",
              name: "Medical Aid",
              amount,
            });
          }
          break;

        case "CUSTOM":
          amount = deduction.amount || 0;
          otherDeductions += amount;
          if (amount > 0) {
            deductionDetails.push({
              deductionType: "CUSTOM",
              name: deduction.name || "Other",
              amount,
            });
          }
          break;
      }
    }

    // If no UIF deduction record but employee is not exempt, calculate UIF
    if (uifAmount === 0 && !employee.uifExempt) {
      uifAmount = calculateUif(grossSalary, false);
      if (uifAmount > 0) {
        deductionDetails.push({
          deductionType: "UIF",
          name: "UIF",
          amount: uifAmount,
        });
      }
    }

    const employeeTotalDeductions = payeAmount + uifAmount + pensionAmount + medicalAidAmount + otherDeductions;
    const netSalary = grossSalary - employeeTotalDeductions;

    // Employer contributions
    const employerUif = employee.uifExempt ? 0 : calculateUif(grossSalary, false);
    const employerSdl = grossSalary * SDL_RATE;

    // Create payroll entry
    const entry = await prisma.payrollEntry.create({
      data: {
        payrollRunId: payrollRun.id,
        employeeId: employee.id,
        grossSalary,
        payeAmount,
        uifAmount,
        pensionAmount,
        medicalAidAmount,
        otherDeductions,
        totalDeductions: employeeTotalDeductions,
        netSalary,
        employerUif,
        employerSdl,
      },
    });

    // Create deduction details
    for (const detail of deductionDetails) {
      await prisma.payrollDeduction.create({
        data: {
          payrollEntryId: entry.id,
          deductionType: detail.deductionType,
          name: detail.name,
          amount: detail.amount,
        },
      });
    }

    totalGross += grossSalary;
    totalDeductions += employeeTotalDeductions;
    totalNet += netSalary;
    totalEmployerUif += employerUif;
    totalEmployerSdl += employerSdl;
  }

  // Update payroll run totals
  await prisma.payrollRun.update({
    where: { id: payrollRun.id },
    data: {
      totalGross,
      totalDeductions,
      totalNet,
      totalEmployerUif,
      totalEmployerSdl,
    },
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practicePayroll(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/payroll");
  revalidatePath("/payroll/run");

  return payrollRun.id;
}

export async function updatePayrollRunStatus(
  payrollRunId: string,
  status: PayrollStatus
) {
  const { practice, user } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const payrollRun = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, practiceId: practice.id },
  });

  if (!payrollRun) throw new Error("Payroll run not found");

  const updateData: Record<string, unknown> = { status };

  if (status === "PROCESSED") {
    updateData.processedAt = new Date();
    updateData.processedById = user.id;
  } else if (status === "PAID") {
    updateData.paidAt = new Date();
  }

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: updateData,
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practicePayroll(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/payroll");
  revalidatePath("/payroll/run");
}

export async function markSarsSubmitted(payrollRunId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const payrollRun = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, practiceId: practice.id },
  });

  if (!payrollRun) throw new Error("Payroll run not found");

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      sarsSubmitted: true,
      sarsSubmittedAt: new Date(),
    },
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.practicePayroll(practice.id));

  revalidatePath("/payroll");
}

// ==================== PAYROLL ENTRY UPDATES ====================

export async function updatePayrollEntry(
  entryId: string,
  data: {
    payeAmount?: number;
    pensionAmount?: number;
    medicalAidAmount?: number;
  }
) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const entry = await prisma.payrollEntry.findFirst({
    where: { id: entryId },
    include: {
      PayrollRun: true,
      Employee: true,
    },
  });

  if (!entry || entry.PayrollRun.practiceId !== practice.id) {
    throw new Error("Entry not found");
  }

  if (entry.PayrollRun.status !== "DRAFT") {
    throw new Error("Cannot modify a processed or paid payroll run");
  }

  // Recalculate totals
  const payeAmount = data.payeAmount ?? entry.payeAmount;
  const pensionAmount = data.pensionAmount ?? entry.pensionAmount;
  const medicalAidAmount = data.medicalAidAmount ?? entry.medicalAidAmount;
  const totalDeductions = payeAmount + entry.uifAmount + pensionAmount + medicalAidAmount + entry.otherDeductions;
  const netSalary = entry.grossSalary - totalDeductions;

  await prisma.payrollEntry.update({
    where: { id: entryId },
    data: {
      payeAmount,
      pensionAmount,
      medicalAidAmount,
      totalDeductions,
      netSalary,
    },
  });

  // Update payroll run totals
  const entries = await prisma.payrollEntry.findMany({
    where: { payrollRunId: entry.payrollRunId },
  });

  const totals = entries.reduce(
    (acc, e) => ({
      totalGross: acc.totalGross + e.grossSalary,
      totalDeductions: acc.totalDeductions + (e.id === entryId ? totalDeductions : e.totalDeductions),
      totalNet: acc.totalNet + (e.id === entryId ? netSalary : e.netSalary),
      totalEmployerUif: acc.totalEmployerUif + e.employerUif,
      totalEmployerSdl: acc.totalEmployerSdl + e.employerSdl,
    }),
    { totalGross: 0, totalDeductions: 0, totalNet: 0, totalEmployerUif: 0, totalEmployerSdl: 0 }
  );

  await prisma.payrollRun.update({
    where: { id: entry.payrollRunId },
    data: totals,
  });

  // Invalidate caches
  await invalidateCache(cacheKeys.practicePayroll(practice.id));

  revalidatePath("/payroll");
  revalidatePath("/payroll/run");
}

// ==================== PAYROLL HISTORY ====================

export async function getPayrollHistory(employeeId?: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const where: Record<string, unknown> = {
    PayrollRun: { practiceId: practice.id },
  };

  if (employeeId) {
    where.employeeId = employeeId;
  }

  return await prisma.payrollEntry.findMany({
    where,
    include: {
      PayrollRun: {
        select: {
          month: true,
          year: true,
          status: true,
          paidAt: true,
        },
      },
      Employee: {
        select: {
          id: true,
          fullName: true,
          position: true,
        },
      },
      PayrollDeduction: true,
    },
    orderBy: [
      { PayrollRun: { year: "desc" } },
      { PayrollRun: { month: "desc" } },
    ],
  });
}

// ==================== EXPORTS ====================

export async function generateBankExport(payrollRunId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const payrollRun = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, practiceId: practice.id },
    include: {
      PayrollEntry: {
        include: {
          Employee: {
            select: {
              fullName: true,
              bankName: true,
              bankAccountNumber: true,
              bankBranchCode: true,
            },
          },
        },
      },
    },
  });

  if (!payrollRun) throw new Error("Payroll run not found");

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const reference = `Salary ${monthNames[payrollRun.month - 1]} ${payrollRun.year}`;

  const rows = [
    ["Employee Name", "Bank Name", "Account Number", "Branch Code", "Amount", "Reference"],
    ...payrollRun.PayrollEntry.map((entry) => [
      entry.Employee.fullName,
      entry.Employee.bankName || "",
      entry.Employee.bankAccountNumber || "",
      entry.Employee.bankBranchCode || "",
      entry.netSalary.toFixed(2),
      reference,
    ]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

export async function generateAccountantExport(payrollRunId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const payrollRun = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, practiceId: practice.id },
    include: {
      PayrollEntry: {
        include: {
          Employee: {
            select: {
              fullName: true,
              employeeNumber: true,
            },
          },
          PayrollDeduction: true,
        },
      },
    },
  });

  if (!payrollRun) throw new Error("Payroll run not found");

  const rows = [
    [
      "Employee Number",
      "Employee Name",
      "Gross Salary",
      "PAYE",
      "UIF (Employee)",
      "Pension",
      "Medical Aid",
      "Other Deductions",
      "Total Deductions",
      "Net Salary",
      "UIF (Employer)",
      "SDL (Employer)",
    ],
    ...payrollRun.PayrollEntry.map((entry) => [
      entry.Employee.employeeNumber || "",
      entry.Employee.fullName,
      entry.grossSalary.toFixed(2),
      entry.payeAmount.toFixed(2),
      entry.uifAmount.toFixed(2),
      entry.pensionAmount.toFixed(2),
      entry.medicalAidAmount.toFixed(2),
      entry.otherDeductions.toFixed(2),
      entry.totalDeductions.toFixed(2),
      entry.netSalary.toFixed(2),
      entry.employerUif.toFixed(2),
      entry.employerSdl.toFixed(2),
    ]),
    // Totals row
    [
      "",
      "TOTALS",
      payrollRun.totalGross.toFixed(2),
      payrollRun.PayrollEntry.reduce((sum, e) => sum + e.payeAmount, 0).toFixed(2),
      payrollRun.PayrollEntry.reduce((sum, e) => sum + e.uifAmount, 0).toFixed(2),
      payrollRun.PayrollEntry.reduce((sum, e) => sum + e.pensionAmount, 0).toFixed(2),
      payrollRun.PayrollEntry.reduce((sum, e) => sum + e.medicalAidAmount, 0).toFixed(2),
      payrollRun.PayrollEntry.reduce((sum, e) => sum + e.otherDeductions, 0).toFixed(2),
      payrollRun.totalDeductions.toFixed(2),
      payrollRun.totalNet.toFixed(2),
      payrollRun.totalEmployerUif.toFixed(2),
      payrollRun.totalEmployerSdl.toFixed(2),
    ],
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

// ==================== SARS SUMMARY ====================

export async function getSarsSummary(month: number, year: number) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const payrollRun = await prisma.payrollRun.findFirst({
    where: {
      practiceId: practice.id,
      month,
      year,
    },
    include: {
      PayrollEntry: true,
    },
  });

  if (!payrollRun) return null;

  const totalPaye = payrollRun.PayrollEntry.reduce((sum, e) => sum + e.payeAmount, 0);
  const totalUifEmployee = payrollRun.PayrollEntry.reduce((sum, e) => sum + e.uifAmount, 0);
  const totalUifEmployer = payrollRun.totalEmployerUif;
  const totalSdl = payrollRun.totalEmployerSdl;

  return {
    month,
    year,
    dueDate: new Date(year, month, 7), // 7th of the following month
    paye: totalPaye,
    uifEmployee: totalUifEmployee,
    uifEmployer: totalUifEmployer,
    sdl: totalSdl,
    totalDue: totalPaye + totalUifEmployee + totalUifEmployer + totalSdl,
    submitted: payrollRun.sarsSubmitted,
    submittedAt: payrollRun.sarsSubmittedAt,
  };
}

// ==================== PAYSLIP DATA ====================

export async function getPayslipData(entryId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const entry = await prisma.payrollEntry.findFirst({
    where: { id: entryId },
    include: {
      PayrollRun: {
        include: {
          Practice: {
            select: {
              name: true,
              address: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      Employee: {
        select: {
          id: true,
          fullName: true,
          position: true,
          department: true,
          employeeNumber: true,
          idNumber: true,
          taxNumber: true,
          annualLeaveBalance: true,
          sickLeaveBalance: true,
          familyLeaveBalance: true,
          bankName: true,
          bankAccountNumber: true,
          bankBranchCode: true,
          hireDate: true,
          address: true,
          grossSalary: true, // Base salary for payslip
        },
      },
      PayrollDeduction: true,
      PayrollAddition: true,
    },
  });

  if (!entry || entry.PayrollRun.practiceId !== practice.id) {
    throw new Error("Payroll entry not found");
  }

  // Get YTD figures by summing all entries for this employee in the current tax year
  const month = entry.PayrollRun.month;
  const year = entry.PayrollRun.year;

  // Tax year in SA runs March to February
  const taxYearStart = month >= 3
    ? new Date(year, 2, 1) // March of current year
    : new Date(year - 1, 2, 1); // March of previous year

  const ytdEntries = await prisma.payrollEntry.findMany({
    where: {
      employeeId: entry.Employee.id,
      PayrollRun: {
        practiceId: practice.id,
        status: { in: ["PROCESSED", "PAID"] },
        OR: [
          // Same tax year entries
          {
            year: taxYearStart.getFullYear(),
            month: { gte: 3 },
          },
          {
            year: taxYearStart.getFullYear() + 1,
            month: { lte: 2 },
          },
        ],
      },
    },
    include: {
      PayrollRun: {
        select: { month: true, year: true },
      },
    },
  });

  // Filter to only include entries up to and including current month
  const relevantEntries = ytdEntries.filter(e => {
    const entryDate = new Date(e.PayrollRun.year, e.PayrollRun.month - 1, 1);
    const currentDate = new Date(year, month - 1, 1);
    return entryDate <= currentDate;
  });

  // Calculate YTD totals
  const ytdGross = relevantEntries.reduce((sum, e) => sum + e.grossSalary, 0);
  const ytdPaye = relevantEntries.reduce((sum, e) => sum + e.payeAmount, 0);
  const ytdUif = relevantEntries.reduce((sum, e) => sum + e.uifAmount, 0);
  const ytdDeductions = relevantEntries.reduce((sum, e) => sum + e.totalDeductions, 0);
  const ytdNet = relevantEntries.reduce((sum, e) => sum + e.netSalary, 0);
  const ytdEmployerUIF = relevantEntries.reduce((sum, e) => sum + e.employerUif, 0);
  const ytdEmployerSDL = relevantEntries.reduce((sum, e) => sum + e.employerSdl, 0);

  // Build deductions array from individual amounts
  const deductions: Array<{ name: string; amount: number; isEmployerContribution?: boolean }> = [];

  if (entry.uifAmount > 0) {
    deductions.push({ name: "UIF - Employee", amount: entry.uifAmount });
  }
  if (entry.pensionAmount > 0) {
    deductions.push({ name: "Pension Fund", amount: entry.pensionAmount });
  }
  if (entry.medicalAidAmount > 0) {
    deductions.push({ name: "Medical Aid", amount: entry.medicalAidAmount });
  }
  if (entry.payeAmount > 0) {
    deductions.push({ name: "Tax", amount: entry.payeAmount });
  }

  // Add any other deductions from PayrollDeduction records (garnishee orders, custom)
  for (const ded of entry.PayrollDeduction) {
    if (!["PAYE", "UIF", "PENSION", "MEDICAL_AID"].includes(ded.deductionType)) {
      deductions.push({ name: ded.name, amount: ded.amount });
    }
  }

  // Build allowances/additions array from PayrollAddition records
  const allowances: Array<{ name: string; amount: number }> = [];
  for (const addition of entry.PayrollAddition || []) {
    allowances.push({ name: addition.name, amount: addition.amount });
  }

  // Calculate base salary (gross minus additions)
  const baseSalary = entry.Employee.grossSalary || entry.grossSalary;

  return {
    employeeName: entry.Employee.fullName,
    employeeNumber: entry.Employee.employeeNumber,
    idNumber: entry.Employee.idNumber,
    taxNumber: entry.Employee.taxNumber,
    position: entry.Employee.position,
    department: entry.Employee.department,
    employmentDate: entry.Employee.hireDate
      ? new Date(entry.Employee.hireDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
      : null,
    employeeAddress: entry.Employee.address,
    bankName: entry.Employee.bankName,
    bankAccountNumber: entry.Employee.bankAccountNumber,
    bankBranchCode: entry.Employee.bankBranchCode,
    grossSalary: entry.grossSalary,
    basicSalary: baseSalary,
    allowances, // Bonuses, overtime, commission, etc.
    deductions,
    totalDeductions: entry.totalDeductions,
    netPay: entry.netSalary,
    // Employer contributions
    employerUIF: entry.employerUif,
    employerSDL: entry.employerSdl,
    // YTD figures
    ytdGross,
    ytdPaye,
    ytdUif,
    ytdDeductions,
    ytdNet,
    ytdEmployerUIF,
    ytdEmployerSDL,
    // Leave balances
    leaveBalances: {
      annual: entry.Employee.annualLeaveBalance,
      sick: entry.Employee.sickLeaveBalance,
      family: entry.Employee.familyLeaveBalance,
      annualAdjustment: 0,
      sickAdjustment: 0,
      familyAdjustment: 0,
      annualTaken: 0,
      sickTaken: 0,
      familyTaken: 0,
      annualScheduled: 0,
      sickScheduled: 0,
      familyScheduled: 0,
    },
    companyName: entry.PayrollRun.Practice.name,
    companyAddress: entry.PayrollRun.Practice.address,
  };
}

// ==================== PAYROLL VALIDATION ====================

export async function validatePayrollRun(payrollRunId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const payrollRun = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, practiceId: practice.id },
  });

  if (!payrollRun) {
    throw new Error("Payroll run not found");
  }

  // Import and call the validation function from payroll-compliance
  const { validatePayrollRun: validateRun } = await import("@/lib/payroll-compliance");
  return await validateRun(payrollRunId);
}

// ==================== IRREGULAR PAYMENTS ====================

export async function addIrregularPayment(data: {
  entryId: string;
  paymentType: string;
  name: string;
  amount: number;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify entry belongs to practice and is in DRAFT status
  const entry = await prisma.payrollEntry.findFirst({
    where: { id: data.entryId },
    include: {
      PayrollRun: {
        select: { practiceId: true, status: true, month: true, year: true },
      },
      Employee: {
        select: { id: true, grossSalary: true },
      },
      PayrollAddition: true,
    },
  });

  if (!entry || entry.PayrollRun.practiceId !== practice.id) {
    throw new Error("Payroll entry not found");
  }

  if (entry.PayrollRun.status !== "DRAFT") {
    throw new Error("Cannot modify a processed or paid payroll entry");
  }

  // Create the new addition
  await prisma.payrollAddition.create({
    data: {
      payrollEntryId: data.entryId,
      paymentType: data.paymentType as PaymentType,
      name: data.name,
      amount: data.amount,
    },
  });

  // Recalculate entry totals with all additions
  await recalculatePayrollEntry(data.entryId);

  revalidatePath("/payroll/run");
}

export async function removeIrregularPayment(additionId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify the addition exists and belongs to practice
  const addition = await prisma.payrollAddition.findUnique({
    where: { id: additionId },
    include: {
      PayrollEntry: {
        include: {
          PayrollRun: {
            select: { practiceId: true, status: true },
          },
        },
      },
    },
  });

  if (!addition || addition.PayrollEntry.PayrollRun.practiceId !== practice.id) {
    throw new Error("Payment not found");
  }

  if (addition.PayrollEntry.PayrollRun.status !== "DRAFT") {
    throw new Error("Cannot modify a processed or paid payroll entry");
  }

  const entryId = addition.payrollEntryId;

  // Delete the addition
  await prisma.payrollAddition.delete({
    where: { id: additionId },
  });

  // Recalculate entry totals
  await recalculatePayrollEntry(entryId);

  revalidatePath("/payroll/run");
}

// Helper function to recalculate payroll entry after adding/removing irregular payments
async function recalculatePayrollEntry(entryId: string) {
  const entry = await prisma.payrollEntry.findUnique({
    where: { id: entryId },
    include: {
      PayrollRun: {
        select: { month: true, year: true },
      },
      Employee: {
        select: { id: true, grossSalary: true, uifExempt: true },
      },
      PayrollAddition: true,
    },
  });

  if (!entry) throw new Error("Entry not found");

  const baseSalary = entry.Employee.grossSalary || 0;
  const totalAdditions = entry.PayrollAddition.reduce((sum, a) => sum + a.amount, 0);
  const newGrossSalary = baseSalary + totalAdditions;

  // Recalculate PAYE with all bonuses
  let newPayeAmount = 0;
  try {
    const payeCalculation = await calculatePAYE(
      entry.Employee.id,
      baseSalary,
      entry.PayrollRun.month,
      entry.PayrollRun.year,
      {
        bonusAmount: totalAdditions > 0 ? totalAdditions : undefined,
        paymentType: totalAdditions > 0 ? "BONUS" : undefined,
      }
    );
    newPayeAmount = payeCalculation.monthlyPaye;
  } catch (error) {
    console.error("PAYE recalculation error:", error);
  }

  // Recalculate UIF on new gross
  const newUifAmount = entry.Employee.uifExempt ? 0 : calculateUif(newGrossSalary, false);
  const newEmployerUif = entry.Employee.uifExempt ? 0 : calculateUif(newGrossSalary, false);
  const newEmployerSdl = newGrossSalary * SDL_RATE;

  const newTotalDeductions = newPayeAmount + newUifAmount + entry.pensionAmount + entry.medicalAidAmount + entry.otherDeductions;
  const newNetSalary = newGrossSalary - newTotalDeductions;

  // Determine payment type based on additions
  let paymentType: PaymentType = "REGULAR";
  if (entry.PayrollAddition.length > 0) {
    // Use the first addition's type, or BONUS if multiple types
    const types = new Set(entry.PayrollAddition.map(a => a.paymentType));
    if (types.size === 1) {
      paymentType = entry.PayrollAddition[0].paymentType;
    } else {
      paymentType = "BONUS"; // Multiple types, use generic BONUS
    }
  }

  await prisma.payrollEntry.update({
    where: { id: entryId },
    data: {
      grossSalary: newGrossSalary,
      payeAmount: newPayeAmount,
      uifAmount: newUifAmount,
      employerUif: newEmployerUif,
      employerSdl: newEmployerSdl,
      totalDeductions: newTotalDeductions,
      netSalary: newNetSalary,
      paymentType,
      bonusAmount: totalAdditions > 0 ? totalAdditions : null,
    },
  });
}

// ==================== GARNISHEE DEDUCTIONS ====================

export async function addGarnisheeDeduction(data: {
  employeeId: string;
  name: string;
  amount: number;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  await prisma.employeeDeduction.create({
    data: {
      employeeId: data.employeeId,
      deductionType: "CUSTOM",
      name: data.name,
      amount: data.amount,
      isActive: true,
    },
  });

  revalidatePath("/payroll");
}

export async function removeGarnisheeDeduction(deductionId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify deduction belongs to an employee in this practice
  const deduction = await prisma.employeeDeduction.findFirst({
    where: {
      id: deductionId,
      Employee: { practiceId: practice.id },
    },
  });

  if (!deduction) {
    throw new Error("Deduction not found");
  }

  // Soft delete by setting isActive to false
  await prisma.employeeDeduction.update({
    where: { id: deductionId },
    data: { isActive: false },
  });

  revalidatePath("/payroll");
}

export async function getEmployeeGarnisheeDeductions(employeeId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const deductions = await prisma.employeeDeduction.findMany({
    where: {
      employeeId,
      deductionType: "CUSTOM",
    },
    orderBy: { createdAt: "desc" },
  });

  return deductions;
}
