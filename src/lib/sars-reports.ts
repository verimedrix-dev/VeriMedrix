/**
 * SARS Statutory Reports Generator
 *
 * This module generates official SARS reports:
 * - EMP201: Monthly Employer Declaration (PAYE, UIF, SDL)
 * - EMP501: Annual Employer Reconciliation
 * - IRP5: Individual Tax Certificate
 *
 * These reports are required for SARS compliance and tax year-end submissions.
 */

import { prisma } from "@/lib/prisma";
import { getCurrentTaxYear } from "@/lib/tax-calculator";
import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// EMP201 - MONTHLY EMPLOYER DECLARATION
// ============================================================================

export interface EMP201Report {
  practice: {
    id: string;
    name: string;
    practiceNumber: string | null;
    address: string | null;
  };
  period: {
    month: number;
    year: number;
    taxYear: string;
    periodEnd: string; // YYYY-MM-DD
  };
  totals: {
    totalPaye: number;
    totalUifEmployee: number;
    totalUifEmployer: number;
    totalUif: number;
    totalSdl: number;
    totalDue: number;
  };
  employeeCount: number;
  dueDate: string; // 7th of following month
  generatedAt: Date;
}

/**
 * Generate EMP201 monthly declaration
 * SARS requires this by the 7th of the following month
 */
export async function generateEMP201(
  practiceId: string,
  month: number,
  year: number
): Promise<EMP201Report> {
  // Fetch practice details
  const practice = await prisma.practice.findUnique({
    where: { id: practiceId },
    select: {
      id: true,
      name: true,
      practiceNumber: true,
      address: true,
    },
  });

  if (!practice) {
    throw new Error(`Practice ${practiceId} not found`);
  }

  // Fetch payroll run for the period
  const payrollRun = await prisma.payrollRun.findFirst({
    where: {
      practiceId,
      month,
      year,
      status: { in: ["PROCESSED", "PAID"] }, // Only include processed payroll
    },
    include: {
      PayrollEntry: true,
    },
  });

  if (!payrollRun) {
    throw new Error(`No processed payroll found for ${month}/${year}`);
  }

  // Calculate totals
  const totals = {
    totalPaye: 0,
    totalUifEmployee: 0,
    totalUifEmployer: 0,
    totalUif: 0,
    totalSdl: 0,
    totalDue: 0,
  };

  for (const entry of payrollRun.PayrollEntry) {
    totals.totalPaye += entry.payeAmount;
    totals.totalUifEmployee += entry.uifAmount;
    totals.totalUifEmployer += entry.employerUif;
    totals.totalSdl += entry.employerSdl;
  }

  totals.totalUif = totals.totalUifEmployee + totals.totalUifEmployer;
  totals.totalDue = totals.totalPaye + totals.totalUif + totals.totalSdl;

  // Calculate due date (7th of following month)
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const dueDate = new Date(nextMonthYear, nextMonth - 1, 7);

  // Period end date (last day of month)
  const periodEnd = new Date(year, month, 0);

  return {
    practice,
    period: {
      month,
      year,
      taxYear: getCurrentTaxYear(month, year),
      periodEnd: periodEnd.toISOString().split("T")[0],
    },
    totals,
    employeeCount: payrollRun.PayrollEntry.length,
    dueDate: dueDate.toISOString().split("T")[0],
    generatedAt: new Date(),
  };
}

// ============================================================================
// EMP501 - ANNUAL EMPLOYER RECONCILIATION
// ============================================================================

export interface EMP501Report {
  practice: {
    id: string;
    name: string;
    practiceNumber: string | null;
    address: string | null;
  };
  taxYear: string;
  period: {
    startDate: string; // March 1
    endDate: string; // February 28/29
  };
  summary: {
    totalEmployees: number;
    totalGross: number;
    totalTaxableIncome: number;
    totalPaye: number;
    totalUifEmployee: number;
    totalUifEmployer: number;
    totalSdl: number;
    totalRetirement: number;
    totalMedicalAid: number;
  };
  employees: Array<{
    employeeId: string;
    fullName: string;
    employeeNumber: string | null;
    taxNumber: string | null;
    ytdGross: number;
    ytdTaxableIncome: number;
    ytdPaye: number;
    ytdUifEmployee: number;
    ytdRetirement: number;
    ytdMedicalAid: number;
  }>;
  generatedAt: Date;
}

/**
 * Generate EMP501 annual reconciliation
 * Required for tax year-end submission
 */
export async function generateEMP501(
  practiceId: string,
  taxYear: string
): Promise<EMP501Report> {
  // Fetch practice details
  const practice = await prisma.practice.findUnique({
    where: { id: practiceId },
    select: {
      id: true,
      name: true,
      practiceNumber: true,
      address: true,
    },
  });

  if (!practice) {
    throw new Error(`Practice ${practiceId} not found`);
  }

  // Fetch YTD data for all employees
  const ytdData = await prisma.employeeYTD.findMany({
    where: {
      taxYear,
      Employee: {
        practiceId,
      },
    },
    include: {
      Employee: {
        select: {
          id: true,
          fullName: true,
          employeeNumber: true,
          taxNumber: true,
        },
      },
    },
    orderBy: {
      Employee: {
        fullName: "asc",
      },
    },
  });

  // Calculate summary totals
  const summary = {
    totalEmployees: ytdData.length,
    totalGross: 0,
    totalTaxableIncome: 0,
    totalPaye: 0,
    totalUifEmployee: 0,
    totalUifEmployer: 0,
    totalSdl: 0,
    totalRetirement: 0,
    totalMedicalAid: 0,
  };

  const employees = ytdData.map((ytd) => {
    const employee = {
      employeeId: ytd.Employee.id,
      fullName: ytd.Employee.fullName,
      employeeNumber: ytd.Employee.employeeNumber,
      taxNumber: ytd.Employee.taxNumber,
      ytdGross: Number(ytd.ytdGross),
      ytdTaxableIncome: Number(ytd.ytdTaxableIncome),
      ytdPaye: Number(ytd.ytdPaye),
      ytdUifEmployee: Number(ytd.ytdUifEmployee),
      ytdRetirement: Number(ytd.ytdRetirement),
      ytdMedicalAid: Number(ytd.ytdMedicalAid),
    };

    // Accumulate summary totals
    summary.totalGross += employee.ytdGross;
    summary.totalTaxableIncome += employee.ytdTaxableIncome;
    summary.totalPaye += employee.ytdPaye;
    summary.totalUifEmployee += employee.ytdUifEmployee;
    summary.totalUifEmployer += Number(ytd.ytdUifEmployer);
    summary.totalSdl += Number(ytd.ytdSdl);
    summary.totalRetirement += employee.ytdRetirement;
    summary.totalMedicalAid += employee.ytdMedicalAid;

    return employee;
  });

  // Parse tax year to get period dates
  const [startYear, endYear] = taxYear.split("/").map(Number);
  const periodStart = new Date(startYear, 2, 1); // March 1
  const periodEnd = new Date(endYear, 1, 28); // February 28 (leap years will be 29)

  return {
    practice,
    taxYear,
    period: {
      startDate: periodStart.toISOString().split("T")[0],
      endDate: periodEnd.toISOString().split("T")[0],
    },
    summary,
    employees,
    generatedAt: new Date(),
  };
}

// ============================================================================
// IRP5 - INDIVIDUAL TAX CERTIFICATE
// ============================================================================

export interface IRP5Certificate {
  employee: {
    id: string;
    fullName: string;
    employeeNumber: string | null;
    taxNumber: string | null;
    dateOfBirth: Date | null;
  };
  employer: {
    name: string;
    practiceNumber: string | null;
    address: string | null;
  };
  taxYear: string;
  period: {
    startDate: string;
    endDate: string;
  };
  income: {
    grossRemuneration: number;
    taxableIncome: number;
    fringeBenefits: number;
  };
  deductions: {
    paye: number;
    uif: number;
    pensionFund: number;
    retirementAnnuity: number;
    medicalAid: number;
  };
  taxCredits: {
    medicalTaxCredits: number;
  };
  generatedAt: Date;
  certificateNumber: string;
}

/**
 * Generate IRP5 tax certificate for individual employee
 * Employee copy for annual tax return filing
 */
export async function generateIRP5(
  employeeId: string,
  taxYear: string
): Promise<IRP5Certificate> {
  // Fetch employee details
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      fullName: true,
      employeeNumber: true,
      taxNumber: true,
      dateOfBirth: true,
      Practice: {
        select: {
          name: true,
          practiceNumber: true,
          address: true,
        },
      },
    },
  });

  if (!employee) {
    throw new Error(`Employee ${employeeId} not found`);
  }

  // Fetch YTD data
  const ytd = await prisma.employeeYTD.findUnique({
    where: {
      employeeId_taxYear: {
        employeeId,
        taxYear,
      },
    },
  });

  if (!ytd) {
    throw new Error(`No YTD data found for employee ${employeeId} in ${taxYear}`);
  }

  // Parse tax year for period
  const [startYear, endYear] = taxYear.split("/").map(Number);
  const periodStart = new Date(startYear, 2, 1);
  const periodEnd = new Date(endYear, 1, 28);

  // Generate certificate number (format: TAXYEAR-EMPLOYEEID-TIMESTAMP)
  const timestamp = Date.now().toString(36).toUpperCase();
  const certificateNumber = `${taxYear.replace("/", "")}-${employee.employeeNumber || employee.id.slice(0, 8).toUpperCase()}-${timestamp}`;

  return {
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      employeeNumber: employee.employeeNumber,
      taxNumber: employee.taxNumber,
      dateOfBirth: employee.dateOfBirth,
    },
    employer: {
      name: employee.Practice.name,
      practiceNumber: employee.Practice.practiceNumber,
      address: employee.Practice.address,
    },
    taxYear,
    period: {
      startDate: periodStart.toISOString().split("T")[0],
      endDate: periodEnd.toISOString().split("T")[0],
    },
    income: {
      grossRemuneration: Number(ytd.ytdGross),
      taxableIncome: Number(ytd.ytdTaxableIncome),
      fringeBenefits: Number(ytd.ytdFringeBenefits),
    },
    deductions: {
      paye: Number(ytd.ytdPaye),
      uif: Number(ytd.ytdUifEmployee),
      pensionFund: Number(ytd.ytdRetirement),
      retirementAnnuity: 0, // Not tracked separately yet
      medicalAid: Number(ytd.ytdMedicalAid),
    },
    taxCredits: {
      medicalTaxCredits: Number(ytd.ytdMedicalCredits),
    },
    generatedAt: new Date(),
    certificateNumber,
  };
}

// ============================================================================
// EXPORT FUNCTIONS (CSV FORMAT)
// ============================================================================

/**
 * Export EMP201 as CSV for SARS eFiling
 */
export function exportEMP201CSV(report: EMP201Report): string {
  const rows = [
    ["EMP201 - Monthly Employer Declaration"],
    [""],
    ["Practice Name", report.practice.name],
    ["Practice Number", report.practice.practiceNumber || "N/A"],
    ["Period", `${report.period.month}/${report.period.year}`],
    ["Tax Year", report.period.taxYear],
    [""],
    ["Description", "Amount (R)"],
    ["Total PAYE", report.totals.totalPaye.toFixed(2)],
    ["Total UIF - Employee", report.totals.totalUifEmployee.toFixed(2)],
    ["Total UIF - Employer", report.totals.totalUifEmployer.toFixed(2)],
    ["Total SDL", report.totals.totalSdl.toFixed(2)],
    [""],
    ["Total Amount Due", report.totals.totalDue.toFixed(2)],
    ["Due Date", report.dueDate],
    [""],
    ["Employee Count", report.employeeCount.toString()],
    ["Generated", report.generatedAt.toISOString()],
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

/**
 * Export EMP501 as CSV for SARS eFiling
 */
export function exportEMP501CSV(report: EMP501Report): string {
  const rows = [
    ["EMP501 - Annual Employer Reconciliation"],
    ["Tax Year", report.taxYear],
    ["Practice", report.practice.name],
    [""],
    ["Employee Name", "Employee Number", "Tax Number", "Gross Income", "Taxable Income", "PAYE", "UIF", "Pension", "Medical Aid"],
  ];

  for (const emp of report.employees) {
    rows.push([
      emp.fullName,
      emp.employeeNumber || "",
      emp.taxNumber || "",
      emp.ytdGross.toFixed(2),
      emp.ytdTaxableIncome.toFixed(2),
      emp.ytdPaye.toFixed(2),
      emp.ytdUifEmployee.toFixed(2),
      emp.ytdRetirement.toFixed(2),
      emp.ytdMedicalAid.toFixed(2),
    ]);
  }

  rows.push([]);
  rows.push(["TOTALS", "", "", report.summary.totalGross.toFixed(2), report.summary.totalTaxableIncome.toFixed(2), report.summary.totalPaye.toFixed(2), report.summary.totalUifEmployee.toFixed(2), report.summary.totalRetirement.toFixed(2), report.summary.totalMedicalAid.toFixed(2)]);

  return rows.map((row) => row.join(",")).join("\n");
}
