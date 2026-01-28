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
