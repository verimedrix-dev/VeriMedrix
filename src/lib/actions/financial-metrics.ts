"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { getCachedData, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";
import { isFeatureAvailable } from "@/lib/subscription-config";
import { Decimal } from "@prisma/client/runtime/library";
import {
  FinancialMetricsData,
  getCurrentPeriod,
  getLastPeriods,
} from "@/lib/financial-metrics-utils";

// Cache key for financial metrics
const financialMetricsCacheKey = (practiceId: string) => `practice:${practiceId}:financial-metrics`;

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
