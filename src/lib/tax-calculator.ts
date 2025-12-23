/**
 * SARS PAYE Tax Calculation Engine
 *
 * This module implements South African PAYE (Pay-As-You-Earn) tax calculations
 * according to SARS specifications for the 2024/2025 tax year.
 *
 * Features:
 * - Progressive tax bracket calculation
 * - Age-based rebates (primary, secondary, tertiary)
 * - Medical tax credits
 * - Fringe benefits integration
 * - Annualisation for irregular payments
 * - Detailed calculation breakdown for audit trail
 */

import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { differenceInYears } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

export interface PAYECalculationResult {
  // Core amounts
  grossSalary: number;
  fringeBenefits: number;
  taxableIncome: number;
  annualisedIncome: number;
  annualisedTax: number;
  monthlyPaye: number;

  // Rebates applied
  rebates: {
    primary: number;
    secondary: number;
    tertiary: number;
    total: number;
    totalMonthly: number;
  };

  // Medical tax credits
  medicalCredits: {
    mainMember: number;
    dependents: number;
    total: number;
  };

  // Breakdown for audit
  breakdown: PAYECalculationBreakdown;
}

export interface PAYECalculationBreakdown {
  steps: string[];
  bracketUsed: {
    minIncome: number;
    maxIncome: number | null;
    rate: number;
    baseTax: number;
  } | null;
  taxYear: string;
  employeeAge: number | null;
  rebatesApplied: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MONTHS_IN_YEAR = 12;
const UIF_RATE = 0.01;
const UIF_CAP_MONTHLY = 177.12;
const SDL_RATE = 0.01;
const RETIREMENT_CONTRIBUTION_CAP_RATE = 0.275; // 27.5% of taxable income

// ============================================================================
// MAIN PAYE CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate PAYE for an employee for a specific month
 *
 * @param employeeId - Employee UUID
 * @param grossSalary - Monthly gross salary
 * @param month - Month number (1-12)
 * @param year - Year (e.g., 2024)
 * @param options - Additional calculation options
 * @returns PAYE calculation result with detailed breakdown
 */
export async function calculatePAYE(
  employeeId: string,
  grossSalary: number,
  month: number,
  year: number,
  options?: {
    bonusAmount?: number;
    paymentType?: string;
  }
): Promise<PAYECalculationResult> {
  const breakdown: PAYECalculationBreakdown = {
    steps: [],
    bracketUsed: null,
    taxYear: getCurrentTaxYear(month, year),
    employeeAge: null,
    rebatesApplied: [],
  };

  breakdown.steps.push(`Starting PAYE calculation for employee ${employeeId}`);
  breakdown.steps.push(`Month: ${month}/${year}, Gross: R${grossSalary.toFixed(2)}`);

  // 1. Fetch employee details
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      dateOfBirth: true,
      medicalAidDependents: true,
      retirementContribution: true,
      payeOverride: true,
    },
  });

  if (!employee) {
    throw new Error(`Employee ${employeeId} not found`);
  }

  // Check for manual PAYE override
  if (employee.payeOverride !== null && employee.payeOverride !== undefined) {
    breakdown.steps.push(`✓ Manual PAYE override found: R${employee.payeOverride.toFixed(2)}`);
    return {
      grossSalary,
      fringeBenefits: 0,
      taxableIncome: grossSalary,
      annualisedIncome: grossSalary * MONTHS_IN_YEAR,
      annualisedTax: employee.payeOverride * MONTHS_IN_YEAR,
      monthlyPaye: employee.payeOverride,
      rebates: { primary: 0, secondary: 0, tertiary: 0, total: 0, totalMonthly: 0 },
      medicalCredits: { mainMember: 0, dependents: 0, total: 0 },
      breakdown,
    };
  }

  // 2. Calculate employee age (for rebate determination)
  let employeeAge: number | null = null;
  if (employee.dateOfBirth) {
    employeeAge = differenceInYears(new Date(year, month - 1, 1), employee.dateOfBirth);
    breakdown.employeeAge = employeeAge;
    breakdown.steps.push(`Employee age: ${employeeAge} years`);
  }

  // 3. Fetch fringe benefits for the period
  const fringeBenefits = await getFringeBenefitsForMonth(employeeId, month, year);
  breakdown.steps.push(`Fringe benefits: R${fringeBenefits.toFixed(2)}`);

  // 4. Calculate taxable income
  const taxableIncome = grossSalary + fringeBenefits + (options?.bonusAmount || 0);
  breakdown.steps.push(`Taxable income: R${grossSalary.toFixed(2)} + R${fringeBenefits.toFixed(2)} ${options?.bonusAmount ? `+ R${options.bonusAmount.toFixed(2)} (bonus)` : ""} = R${taxableIncome.toFixed(2)}`);

  // 5. Annualise income
  const annualisedIncome = taxableIncome * MONTHS_IN_YEAR;
  breakdown.steps.push(`Annualised income: R${taxableIncome.toFixed(2)} × 12 = R${annualisedIncome.toFixed(2)}`);

  // 6. Fetch tax brackets
  const brackets = await getTaxBrackets(breakdown.taxYear);
  if (brackets.length === 0) {
    throw new Error(`No tax brackets found for tax year ${breakdown.taxYear}`);
  }

  // 7. Calculate annual tax using brackets
  const annualisedTax = calculateTaxFromBrackets(annualisedIncome, brackets, breakdown);
  breakdown.steps.push(`Annual tax (before rebates): R${annualisedTax.toFixed(2)}`);

  // 8. Fetch and apply rebates
  const rebates = await getTaxRebates(breakdown.taxYear);
  const appliedRebates = applyRebates(annualisedTax, rebates, employeeAge, breakdown);
  breakdown.steps.push(`Total rebates: R${appliedRebates.total.toFixed(2)} (R${appliedRebates.totalMonthly.toFixed(2)}/month)`);

  // 9. Calculate medical tax credits
  const medicalCredits = await calculateMedicalTaxCredits(
    employee.medicalAidDependents,
    breakdown.taxYear,
    breakdown
  );
  breakdown.steps.push(`Medical tax credits: R${medicalCredits.total.toFixed(2)}/month`);

  // 10. Calculate final monthly PAYE
  const annualTaxAfterRebates = Math.max(0, annualisedTax - appliedRebates.total);
  const monthlyTaxBeforeCredits = annualTaxAfterRebates / MONTHS_IN_YEAR;
  const monthlyPaye = Math.max(0, monthlyTaxBeforeCredits - medicalCredits.total);

  breakdown.steps.push(`Monthly PAYE: (R${annualTaxAfterRebates.toFixed(2)} ÷ 12) - R${medicalCredits.total.toFixed(2)} = R${monthlyPaye.toFixed(2)}`);

  return {
    grossSalary,
    fringeBenefits,
    taxableIncome,
    annualisedIncome,
    annualisedTax,
    monthlyPaye: Math.round(monthlyPaye * 100) / 100, // Round to 2 decimals
    rebates: appliedRebates,
    medicalCredits,
    breakdown,
  };
}

// ============================================================================
// TAX BRACKET CALCULATION
// ============================================================================

function calculateTaxFromBrackets(
  annualIncome: number,
  brackets: Array<{
    minIncome: Decimal;
    maxIncome: Decimal | null;
    rate: Decimal;
    baseTax: Decimal;
  }>,
  breakdown: PAYECalculationBreakdown
): number {
  // Find applicable bracket
  const bracket = brackets.find((b) => {
    const min = Number(b.minIncome);
    const max = b.maxIncome ? Number(b.maxIncome) : Infinity;
    return annualIncome >= min && annualIncome <= max;
  });

  if (!bracket) {
    throw new Error(`No tax bracket found for income R${annualIncome.toFixed(2)}`);
  }

  const baseTax = Number(bracket.baseTax);
  const rate = Number(bracket.rate);
  const minIncome = Number(bracket.minIncome);
  const maxIncome = bracket.maxIncome ? Number(bracket.maxIncome) : null;

  // Calculate tax
  const incomeAboveMin = annualIncome - minIncome;
  const taxOnExcess = incomeAboveMin * rate;
  const totalTax = baseTax + taxOnExcess;

  // Record bracket used
  breakdown.bracketUsed = {
    minIncome,
    maxIncome,
    rate,
    baseTax,
  };

  breakdown.steps.push(
    `Tax bracket: R${minIncome.toFixed(0)} - ${maxIncome ? `R${maxIncome.toFixed(0)}` : "∞"} (${(rate * 100).toFixed(0)}%)`
  );
  breakdown.steps.push(
    `Tax calculation: R${baseTax.toFixed(2)} + (R${incomeAboveMin.toFixed(2)} × ${(rate * 100).toFixed(0)}%) = R${totalTax.toFixed(2)}`
  );

  return totalTax;
}

// ============================================================================
// REBATES
// ============================================================================

function applyRebates(
  annualisedTax: number,
  rebates: Array<{
    rebateType: string;
    amount: Decimal;
    ageThreshold: number | null;
  }>,
  employeeAge: number | null,
  breakdown: PAYECalculationBreakdown
) {
  let primary = 0;
  let secondary = 0;
  let tertiary = 0;

  // Primary rebate (everyone gets this)
  const primaryRebate = rebates.find((r) => r.rebateType === "PRIMARY");
  if (primaryRebate) {
    primary = Number(primaryRebate.amount);
    breakdown.rebatesApplied.push(`Primary rebate: R${primary.toFixed(2)}`);
  }

  // Secondary rebate (age 65+)
  if (employeeAge !== null && employeeAge >= 65) {
    const secondaryRebate = rebates.find((r) => r.rebateType === "SECONDARY");
    if (secondaryRebate) {
      secondary = Number(secondaryRebate.amount);
      breakdown.rebatesApplied.push(`Secondary rebate (age 65+): R${secondary.toFixed(2)}`);
    }
  }

  // Tertiary rebate (age 75+)
  if (employeeAge !== null && employeeAge >= 75) {
    const tertiaryRebate = rebates.find((r) => r.rebateType === "TERTIARY");
    if (tertiaryRebate) {
      tertiary = Number(tertiaryRebate.amount);
      breakdown.rebatesApplied.push(`Tertiary rebate (age 75+): R${tertiary.toFixed(2)}`);
    }
  }

  const total = primary + secondary + tertiary;
  const totalMonthly = total / MONTHS_IN_YEAR;

  return {
    primary,
    secondary,
    tertiary,
    total,
    totalMonthly,
  };
}

// ============================================================================
// MEDICAL TAX CREDITS
// ============================================================================

async function calculateMedicalTaxCredits(
  dependents: number,
  taxYear: string,
  breakdown: PAYECalculationBreakdown
) {
  const credits = await prisma.medicalTaxCredit.findUnique({
    where: { taxYear },
  });

  if (!credits) {
    breakdown.steps.push("No medical tax credits configured for this tax year");
    return { mainMember: 0, dependents: 0, total: 0 };
  }

  const mainMember = Number(credits.mainMember);
  const firstDependent = dependents >= 1 ? Number(credits.firstDependent) : 0;
  const otherDependents = dependents > 1 ? (dependents - 1) * Number(credits.otherDependents) : 0;
  const total = mainMember + firstDependent + otherDependents;

  if (total > 0) {
    breakdown.steps.push(
      `Medical credits: R${mainMember} (main) + R${firstDependent} (1st dep) + R${otherDependents} (${dependents - 1} other) = R${total}`
    );
  }

  return {
    mainMember,
    dependents: firstDependent + otherDependents,
    total,
  };
}

// ============================================================================
// FRINGE BENEFITS
// ============================================================================

async function getFringeBenefitsForMonth(
  employeeId: string,
  month: number,
  year: number
): Promise<number> {
  const periodDate = new Date(year, month - 1, 15); // Mid-month check

  const benefits = await prisma.employeeFringeBenefit.findMany({
    where: {
      employeeId,
      effectiveFrom: { lte: periodDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: periodDate } }],
    },
  });

  return benefits.reduce((sum, benefit) => sum + Number(benefit.monthlyTaxableValue), 0);
}

// ============================================================================
// DATABASE QUERIES (Cached)
// ============================================================================

async function getTaxBrackets(taxYear: string) {
  return await prisma.taxBracket.findMany({
    where: { taxYear },
    orderBy: { minIncome: "asc" },
  });
}

async function getTaxRebates(taxYear: string) {
  return await prisma.taxRebate.findMany({
    where: { taxYear },
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determine the tax year based on month/year
 * Tax year runs March 1 to February 28/29
 */
export function getCurrentTaxYear(month: number, year: number): string {
  if (month >= 3) {
    // March to December = year/year+1
    return `${year}/${year + 1}`;
  } else {
    // January to February = year-1/year
    return `${year - 1}/${year}`;
  }
}

/**
 * Calculate UIF (Unemployment Insurance Fund)
 * Employee and employer each contribute 1%, capped at R177.12/month
 */
export function calculateUIF(grossSalary: number, isExempt: boolean): number {
  if (isExempt) return 0;
  return Math.min(grossSalary * UIF_RATE, UIF_CAP_MONTHLY);
}

/**
 * Calculate SDL (Skills Development Levy)
 * Employer pays 1% of gross salary (no employee contribution)
 */
export function calculateSDL(grossSalary: number): number {
  return grossSalary * SDL_RATE;
}

/**
 * Validate retirement contribution against 27.5% limit
 */
export function validateRetirementContribution(
  contribution: number,
  taxableIncome: number
): ValidationResult {
  const maxAllowed = taxableIncome * RETIREMENT_CONTRIBUTION_CAP_RATE;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (contribution > maxAllowed) {
    warnings.push(
      `Retirement contribution R${contribution.toFixed(2)} exceeds 27.5% limit (R${maxAllowed.toFixed(2)}). Excess not tax-deductible.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate bonus tax using annualisation method
 */
export async function calculateBonusTax(
  employeeId: string,
  regularSalary: number,
  bonusAmount: number,
  month: number,
  year: number
): Promise<number> {
  // Calculate tax on regular salary
  const regularTax = await calculatePAYE(employeeId, regularSalary, month, year);

  // Calculate tax on salary + bonus
  const totalTax = await calculatePAYE(employeeId, regularSalary, month, year, {
    bonusAmount,
    paymentType: "BONUS",
  });

  // Tax on bonus is the difference
  return totalTax.monthlyPaye - regularTax.monthlyPaye;
}
