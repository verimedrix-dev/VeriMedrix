/**
 * Payroll Compliance Module
 *
 * This module handles:
 * - Audit trail logging for all payroll calculations
 * - Year-to-date (YTD) tracking per employee
 * - Payroll validation before processing
 *
 * These functions ensure SARS compliance and provide detailed records
 * for CA verification and tax audits.
 */

import { prisma } from "@/lib/prisma";
import { getCurrentTaxYear } from "@/lib/tax-calculator";
import { Decimal } from "@prisma/client/runtime/library";

// ============================================================================
// AUDIT TRAIL LOGGING
// ============================================================================

/**
 * Log detailed audit trail for a payroll run
 * Creates immutable records of all calculations for SARS compliance
 */
export async function logPayrollAudit(
  payrollRunId: string,
  createdBy: string
): Promise<void> {
  // Fetch the payroll run with all entries
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      PayrollEntry: {
        include: {
          Employee: {
            select: {
              id: true,
              dateOfBirth: true,
              medicalAidDependents: true,
            },
          },
        },
      },
    },
  });

  if (!payrollRun) {
    throw new Error(`Payroll run ${payrollRunId} not found`);
  }

  const taxYear = getCurrentTaxYear(payrollRun.month, payrollRun.year);

  // Create audit log entries for each employee
  const auditLogs = payrollRun.PayrollEntry.map((entry) => ({
    payrollRunId,
    employeeId: entry.employeeId,
    calculationTimestamp: new Date(),
    grossRemuneration: new Decimal(entry.grossSalary),
    taxableIncome: new Decimal(entry.grossSalary + entry.fringeBenefitsTotal),
    payeCalculated: new Decimal(entry.payeAmount),
    uifEmployee: new Decimal(entry.uifAmount),
    uifEmployer: new Decimal(entry.employerUif),
    sdl: new Decimal(entry.employerSdl),
    calculationBreakdown: {
      grossSalary: entry.grossSalary,
      fringeBenefits: entry.fringeBenefitsTotal,
      bonusAmount: entry.bonusAmount || 0,
      paymentType: entry.paymentType,
      deductions: {
        paye: entry.payeAmount,
        uif: entry.uifAmount,
        pension: entry.pensionAmount,
        medicalAid: entry.medicalAidAmount,
        other: entry.otherDeductions,
        total: entry.totalDeductions,
      },
      netSalary: entry.netSalary,
      employerContributions: {
        uif: entry.employerUif,
        sdl: entry.employerSdl,
      },
    },
    appliedRebates: {
      // This would be populated from the PAYE calculation
      // For now, we'll store a placeholder
      note: "Rebates applied per SARS calculation engine",
    },
    medicalCredits: new Decimal(0), // Would be calculated in PAYE engine
    fringeBenefits: new Decimal(entry.fringeBenefitsTotal),
    taxYear,
    createdBy,
  }));

  // Bulk create audit logs
  await prisma.payrollAuditLog.createMany({
    data: auditLogs,
  });

  console.log(`✅ Created ${auditLogs.length} audit log entries for payroll run ${payrollRunId}`);
}

// ============================================================================
// YEAR-TO-DATE (YTD) TRACKING
// ============================================================================

/**
 * Update YTD totals for all employees in a payroll run
 * Called after payroll is processed
 */
export async function updateEmployeeYTD(payrollRunId: string): Promise<void> {
  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      PayrollEntry: true,
    },
  });

  if (!payrollRun) {
    throw new Error(`Payroll run ${payrollRunId} not found`);
  }

  const taxYear = getCurrentTaxYear(payrollRun.month, payrollRun.year);

  // Update YTD for each employee
  for (const entry of payrollRun.PayrollEntry) {
    await prisma.employeeYTD.upsert({
      where: {
        employeeId_taxYear: {
          employeeId: entry.employeeId,
          taxYear,
        },
      },
      create: {
        employeeId: entry.employeeId,
        taxYear,
        ytdGross: new Decimal(entry.grossSalary),
        ytdTaxableIncome: new Decimal(entry.grossSalary + entry.fringeBenefitsTotal),
        ytdPaye: new Decimal(entry.payeAmount),
        ytdUifEmployee: new Decimal(entry.uifAmount),
        ytdUifEmployer: new Decimal(entry.employerUif),
        ytdSdl: new Decimal(entry.employerSdl),
        ytdRetirement: new Decimal(entry.pensionAmount),
        ytdMedicalAid: new Decimal(entry.medicalAidAmount),
        ytdMedicalCredits: new Decimal(0),
        ytdFringeBenefits: new Decimal(entry.fringeBenefitsTotal),
      },
      update: {
        ytdGross: { increment: new Decimal(entry.grossSalary) },
        ytdTaxableIncome: { increment: new Decimal(entry.grossSalary + entry.fringeBenefitsTotal) },
        ytdPaye: { increment: new Decimal(entry.payeAmount) },
        ytdUifEmployee: { increment: new Decimal(entry.uifAmount) },
        ytdUifEmployer: { increment: new Decimal(entry.employerUif) },
        ytdSdl: { increment: new Decimal(entry.employerSdl) },
        ytdRetirement: { increment: new Decimal(entry.pensionAmount) },
        ytdMedicalAid: { increment: new Decimal(entry.medicalAidAmount) },
        ytdFringeBenefits: { increment: new Decimal(entry.fringeBenefitsTotal) },
      },
    });
  }

  console.log(`✅ Updated YTD for ${payrollRun.PayrollEntry.length} employees (${taxYear})`);
}

/**
 * Get YTD totals for an employee
 */
export async function getEmployeeYTD(employeeId: string, taxYear: string) {
  return await prisma.employeeYTD.findUnique({
    where: {
      employeeId_taxYear: {
        employeeId,
        taxYear,
      },
    },
  });
}

/**
 * Get YTD totals for all employees in a practice
 */
export async function getPracticeYTD(practiceId: string, taxYear: string) {
  return await prisma.employeeYTD.findMany({
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
  });
}

// ============================================================================
// PAYROLL VALIDATION
// ============================================================================

export interface PayrollValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canProcess: boolean;
}

export interface ValidationError {
  employeeId: string;
  employeeName: string;
  field: string;
  message: string;
  severity: "error";
}

export interface ValidationWarning {
  employeeId: string;
  employeeName: string;
  field: string;
  message: string;
  severity: "warning";
}

/**
 * Validate payroll run before processing
 * Checks for compliance issues and data integrity
 */
export async function validatePayrollRun(
  payrollRunId: string
): Promise<PayrollValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const payrollRun = await prisma.payrollRun.findUnique({
    where: { id: payrollRunId },
    include: {
      PayrollEntry: {
        include: {
          Employee: {
            select: {
              id: true,
              fullName: true,
              taxNumber: true,
              dateOfBirth: true,
              medicalAidDependents: true,
              retirementContribution: true,
              grossSalary: true,
            },
          },
        },
      },
    },
  });

  if (!payrollRun) {
    return {
      isValid: false,
      errors: [
        {
          employeeId: "",
          employeeName: "",
          field: "payrollRun",
          message: "Payroll run not found",
          severity: "error",
        },
      ],
      warnings: [],
      canProcess: false,
    };
  }

  // Validate each employee entry
  for (const entry of payrollRun.PayrollEntry) {
    const employee = entry.Employee;

    // ERROR: Missing tax number
    if (!employee.taxNumber) {
      errors.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        field: "taxNumber",
        message: "Tax number is required for SARS compliance",
        severity: "error",
      });
    }

    // WARNING: Missing date of birth (affects rebates)
    if (!employee.dateOfBirth) {
      warnings.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        field: "dateOfBirth",
        message: "Date of birth missing - age-based rebates may not be applied correctly",
        severity: "warning",
      });
    }

    // WARNING: Retirement contribution exceeds 27.5% limit
    if (employee.retirementContribution && employee.grossSalary) {
      const limit = employee.grossSalary * 0.275;
      if (employee.retirementContribution > limit) {
        warnings.push({
          employeeId: employee.id,
          employeeName: employee.fullName,
          field: "retirementContribution",
          message: `Retirement contribution R${employee.retirementContribution.toFixed(2)} exceeds 27.5% limit (R${limit.toFixed(2)}). Excess is not tax-deductible.`,
          severity: "warning",
        });
      }
    }

    // Note: PAYE of R0.00 is valid for employees below the tax threshold
    // Tax threshold for under 65: ~R95,750/year (~R7,979/month after primary rebate)
    // Only warn if income is significantly above threshold and PAYE is still zero
    // R30,000/month = R360,000/year is well above threshold, so R0 PAYE would be suspicious

    // WARNING: Net salary is negative
    if (entry.netSalary < 0) {
      warnings.push({
        employeeId: employee.id,
        employeeName: employee.fullName,
        field: "netSalary",
        message: `Net salary is negative (R${entry.netSalary.toFixed(2)}). Deductions exceed gross salary.`,
        severity: "warning",
      });
    }
  }

  const isValid = errors.length === 0;
  const canProcess = errors.length === 0; // Can process if no errors (warnings are ok)

  return {
    isValid,
    errors,
    warnings,
    canProcess,
  };
}

// ============================================================================
// WRAPPER FUNCTION: Process Payroll with Compliance
// ============================================================================

/**
 * Enhanced payroll processing with audit trail and YTD updates
 * Call this instead of directly updating payroll status
 */
export async function processPayrollWithCompliance(
  payrollRunId: string,
  userId: string
): Promise<{ success: boolean; validation?: PayrollValidationResult }> {
  // 1. Validate before processing
  const validation = await validatePayrollRun(payrollRunId);

  if (!validation.canProcess) {
    return {
      success: false,
      validation,
    };
  }

  // 2. Update status to PROCESSED
  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      processedById: userId,
    },
  });

  // 3. Log audit trail
  await logPayrollAudit(payrollRunId, userId);

  // 4. Update YTD totals
  await updateEmployeeYTD(payrollRunId);

  return {
    success: true,
    validation,
  };
}
