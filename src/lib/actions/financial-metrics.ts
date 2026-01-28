"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { getCachedData, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";
import { isFeatureAvailable } from "@/lib/subscription-config";
import { Decimal } from "@prisma/client/runtime/library";

// Cache key for financial metrics
const financialMetricsCacheKey = (practiceId: string) => `practice:${practiceId}:financial-metrics`;

// Metric configuration with target ranges
export const METRIC_CONFIG = {
  revenuePerConsult: {
    name: "Revenue per Consult",
    unit: "currency",
    target: null, // YoY growth - no fixed target
    acceptableMin: null,
    acceptableMax: null,
    lowerIsBetter: false,
    description: "Average revenue generated per patient consultation",
  },
  billingErrorRate: {
    name: "Billing Error Rate",
    unit: "percentage",
    target: 2,
    acceptableMin: 0,
    acceptableMax: 5,
    lowerIsBetter: true,
    description: "Percentage of claims rejected or requiring correction",
  },
  profitAllocation: {
    name: "Profit Allocation",
    unit: "percentage",
    target: 10,
    acceptableMin: 5,
    acceptableMax: 15,
    lowerIsBetter: false,
    description: "Percentage of revenue allocated to profit",
  },
  ownerPayAllocation: {
    name: "Owner's Pay Allocation",
    unit: "percentage",
    target: 30,
    acceptableMin: 25,
    acceptableMax: 35,
    lowerIsBetter: false,
    description: "Percentage of revenue allocated to owner compensation",
  },
  taxReserveAllocation: {
    name: "Tax Reserve Allocation",
    unit: "percentage",
    target: 20,
    acceptableMin: 15,
    acceptableMax: 25,
    lowerIsBetter: false,
    description: "Percentage of revenue set aside for taxes",
  },
  payrollPercentage: {
    name: "Payroll % of Revenue",
    unit: "percentage",
    target: 30,
    acceptableMin: 25,
    acceptableMax: 35,
    lowerIsBetter: true,
    description: "Staff payroll as a percentage of total revenue",
  },
  consumablesPercentage: {
    name: "Consumables % of Revenue",
    unit: "percentage",
    target: 10,
    acceptableMin: 8,
    acceptableMax: 15,
    lowerIsBetter: true,
    description: "Medical consumables cost as percentage of revenue",
  },
  rentPercentage: {
    name: "Rent % of Revenue",
    unit: "percentage",
    target: 12,
    acceptableMin: 10,
    acceptableMax: 15,
    lowerIsBetter: true,
    description: "Rent/premises cost as percentage of revenue",
  },
  overheadsPercentage: {
    name: "Overheads % of Revenue",
    unit: "percentage",
    target: 55,
    acceptableMin: 50,
    acceptableMax: 65,
    lowerIsBetter: true,
    description: "Total overhead costs as percentage of revenue",
  },
  medicalAidDSODays: {
    name: "Medical Aid DSO",
    unit: "days",
    target: 45,
    acceptableMin: 30,
    acceptableMax: 60,
    lowerIsBetter: true,
    description: "Days Sales Outstanding for medical aid payments",
  },
  cashCollectionDays: {
    name: "Cash Collection Speed",
    unit: "days",
    target: 7,
    acceptableMin: 0,
    acceptableMax: 14,
    lowerIsBetter: true,
    description: "Average days to collect cash payments",
  },
} as const;

export type MetricKey = keyof typeof METRIC_CONFIG;

// Helper to get current period in YYYY-MM format
export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Helper to get previous period
export function getPreviousPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

// Helper to format period for display
export function formatPeriod(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

// Get last N periods
export function getLastPeriods(count: number): string[] {
  const periods: string[] = [];
  let currentPeriod = getCurrentPeriod();

  for (let i = 0; i < count; i++) {
    periods.push(currentPeriod);
    currentPeriod = getPreviousPeriod(currentPeriod);
  }

  return periods;
}

// Type for metrics data
export interface FinancialMetricsData {
  id: string;
  period: string;
  revenuePerConsult: number | null;
  billingErrorRate: number | null;
  profitAllocation: number | null;
  ownerPayAllocation: number | null;
  taxReserveAllocation: number | null;
  payrollPercentage: number | null;
  consumablesPercentage: number | null;
  rentPercentage: number | null;
  overheadsPercentage: number | null;
  medicalAidDSODays: number | null;
  cashCollectionDays: number | null;
  totalRevenue: number | null;
  totalConsults: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Convert Prisma Decimal to number
function decimalToNumber(value: Decimal | null): number | null {
  if (value === null) return null;
  return value.toNumber();
}

// Transform database record to FinancialMetricsData
function transformMetrics(record: {
  id: string;
  period: string;
  revenuePerConsult: Decimal | null;
  billingErrorRate: Decimal | null;
  profitAllocation: Decimal | null;
  ownerPayAllocation: Decimal | null;
  taxReserveAllocation: Decimal | null;
  payrollPercentage: Decimal | null;
  consumablesPercentage: Decimal | null;
  rentPercentage: Decimal | null;
  overheadsPercentage: Decimal | null;
  medicalAidDSODays: number | null;
  cashCollectionDays: number | null;
  totalRevenue: Decimal | null;
  totalConsults: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FinancialMetricsData {
  return {
    id: record.id,
    period: record.period,
    revenuePerConsult: decimalToNumber(record.revenuePerConsult),
    billingErrorRate: decimalToNumber(record.billingErrorRate),
    profitAllocation: decimalToNumber(record.profitAllocation),
    ownerPayAllocation: decimalToNumber(record.ownerPayAllocation),
    taxReserveAllocation: decimalToNumber(record.taxReserveAllocation),
    payrollPercentage: decimalToNumber(record.payrollPercentage),
    consumablesPercentage: decimalToNumber(record.consumablesPercentage),
    rentPercentage: decimalToNumber(record.rentPercentage),
    overheadsPercentage: decimalToNumber(record.overheadsPercentage),
    medicalAidDSODays: record.medicalAidDSODays,
    cashCollectionDays: record.cashCollectionDays,
    totalRevenue: decimalToNumber(record.totalRevenue),
    totalConsults: record.totalConsults,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// Get financial metrics data for dashboard
export async function getFinancialMetricsData() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  // Check feature access
  if (!isFeatureAvailable(practice.subscriptionTier, "financialMetrics")) {
    return { featureNotAvailable: true, metrics: [], currentPeriod: getCurrentPeriod() };
  }

  return getCachedData(
    financialMetricsCacheKey(practice.id),
    async () => {
      return withDbConnection(async () => {
        const periods = getLastPeriods(13); // Current + 12 months for trends

        const records = await prisma.practiceFinancialMetrics.findMany({
          where: {
            practiceId: practice.id,
            period: { in: periods },
          },
          orderBy: { period: "desc" },
        });

        return {
          featureNotAvailable: false,
          metrics: records.map(transformMetrics),
          currentPeriod: getCurrentPeriod(),
        };
      });
    },
    CACHE_DURATIONS.SHORT
  );
}

// Get metrics for a specific period
export async function getMetricsForPeriod(period: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  // Check feature access
  if (!isFeatureAvailable(practice.subscriptionTier, "financialMetrics")) {
    throw new Error("Financial Metrics is only available on the Professional plan");
  }

  const record = await prisma.practiceFinancialMetrics.findUnique({
    where: {
      practiceId_period: {
        practiceId: practice.id,
        period,
      },
    },
  });

  return record ? transformMetrics(record) : null;
}

// Input type for saving metrics
export interface SaveFinancialMetricsInput {
  period: string;
  revenuePerConsult?: number | null;
  billingErrorRate?: number | null;
  profitAllocation?: number | null;
  ownerPayAllocation?: number | null;
  taxReserveAllocation?: number | null;
  payrollPercentage?: number | null;
  consumablesPercentage?: number | null;
  rentPercentage?: number | null;
  overheadsPercentage?: number | null;
  medicalAidDSODays?: number | null;
  cashCollectionDays?: number | null;
  totalRevenue?: number | null;
  totalConsults?: number | null;
  notes?: string | null;
}

// Save financial metrics (upsert)
export async function saveFinancialMetrics(data: SaveFinancialMetricsInput) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  // Check feature access
  if (!isFeatureAvailable(practice.subscriptionTier, "financialMetrics")) {
    throw new Error("Financial Metrics is only available on the Professional plan");
  }

  // Validate period format
  if (!/^\d{4}-\d{2}$/.test(data.period)) {
    throw new Error("Invalid period format. Use YYYY-MM");
  }

  const record = await prisma.practiceFinancialMetrics.upsert({
    where: {
      practiceId_period: {
        practiceId: practice.id,
        period: data.period,
      },
    },
    update: {
      revenuePerConsult: data.revenuePerConsult,
      billingErrorRate: data.billingErrorRate,
      profitAllocation: data.profitAllocation,
      ownerPayAllocation: data.ownerPayAllocation,
      taxReserveAllocation: data.taxReserveAllocation,
      payrollPercentage: data.payrollPercentage,
      consumablesPercentage: data.consumablesPercentage,
      rentPercentage: data.rentPercentage,
      overheadsPercentage: data.overheadsPercentage,
      medicalAidDSODays: data.medicalAidDSODays,
      cashCollectionDays: data.cashCollectionDays,
      totalRevenue: data.totalRevenue,
      totalConsults: data.totalConsults,
      notes: data.notes,
      enteredById: user.id,
    },
    create: {
      practiceId: practice.id,
      period: data.period,
      revenuePerConsult: data.revenuePerConsult,
      billingErrorRate: data.billingErrorRate,
      profitAllocation: data.profitAllocation,
      ownerPayAllocation: data.ownerPayAllocation,
      taxReserveAllocation: data.taxReserveAllocation,
      payrollPercentage: data.payrollPercentage,
      consumablesPercentage: data.consumablesPercentage,
      rentPercentage: data.rentPercentage,
      overheadsPercentage: data.overheadsPercentage,
      medicalAidDSODays: data.medicalAidDSODays,
      cashCollectionDays: data.cashCollectionDays,
      totalRevenue: data.totalRevenue,
      totalConsults: data.totalConsults,
      notes: data.notes,
      enteredById: user.id,
    },
  });

  // Invalidate cache
  await invalidateCache(financialMetricsCacheKey(practice.id));

  revalidatePath("/financial-metrics");

  return transformMetrics(record);
}

// Delete metrics for a period
export async function deleteFinancialMetrics(period: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Check feature access
  if (!isFeatureAvailable(practice.subscriptionTier, "financialMetrics")) {
    throw new Error("Financial Metrics is only available on the Professional plan");
  }

  await prisma.practiceFinancialMetrics.delete({
    where: {
      practiceId_period: {
        practiceId: practice.id,
        period,
      },
    },
  });

  // Invalidate cache
  await invalidateCache(financialMetricsCacheKey(practice.id));

  revalidatePath("/financial-metrics");
}

// Calculate metric status: "green" | "amber" | "red" | "neutral"
export function getMetricStatus(
  metricKey: MetricKey,
  value: number | null
): "green" | "amber" | "red" | "neutral" {
  if (value === null) return "neutral";

  const config = METRIC_CONFIG[metricKey];

  // Revenue per consult has no fixed target
  if (config.target === null) return "neutral";

  const { target, acceptableMin, acceptableMax, lowerIsBetter } = config;

  // Check if within target (green)
  if (lowerIsBetter) {
    if (value <= target) return "green";
  } else {
    if (value >= target) return "green";
  }

  // Check if within acceptable range (amber)
  if (acceptableMin !== null && acceptableMax !== null) {
    if (value >= acceptableMin && value <= acceptableMax) return "amber";
  }

  // Outside acceptable range (red)
  return "red";
}

// Format metric value for display
export function formatMetricValue(
  metricKey: MetricKey,
  value: number | null
): string {
  if (value === null) return "—";

  const config = METRIC_CONFIG[metricKey];

  switch (config.unit) {
    case "currency":
      return `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percentage":
      return `${value.toFixed(1)}%`;
    case "days":
      return `${value} days`;
    default:
      return value.toString();
  }
}
