"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  METRIC_CONFIG,
  MetricKey,
  getMetricStatus,
  formatMetricValue,
} from "@/lib/actions/financial-metrics";

interface MetricCardProps {
  metricKey: MetricKey;
  value: number | null;
  previousValue?: number | null;
  className?: string;
}

export function MetricCard({ metricKey, value, previousValue, className }: MetricCardProps) {
  const config = METRIC_CONFIG[metricKey];
  const status = getMetricStatus(metricKey, value);
  const formattedValue = formatMetricValue(metricKey, value);

  // Calculate trend
  const getTrend = () => {
    if (value === null || previousValue === null || previousValue === undefined) {
      return null;
    }
    const diff = value - previousValue;
    if (Math.abs(diff) < 0.1) return "stable";
    return diff > 0 ? "up" : "down";
  };

  const trend = getTrend();

  // Determine if trend is positive based on whether lower is better
  const isTrendPositive = () => {
    if (trend === null || trend === "stable") return null;
    if (config.lowerIsBetter) {
      return trend === "down";
    }
    return trend === "up";
  };

  const trendPositive = isTrendPositive();

  // Status colors
  const statusColors = {
    green: "border-l-4 border-l-green-500",
    amber: "border-l-4 border-l-amber-500",
    red: "border-l-4 border-l-red-500",
    neutral: "border-l-4 border-l-slate-300 dark:border-l-slate-600",
  };

  const statusBgColors = {
    green: "bg-green-50 dark:bg-green-950/20",
    amber: "bg-amber-50 dark:bg-amber-950/20",
    red: "bg-red-50 dark:bg-red-950/20",
    neutral: "",
  };

  const statusTextColors = {
    green: "text-green-700 dark:text-green-400",
    amber: "text-amber-700 dark:text-amber-400",
    red: "text-red-700 dark:text-red-400",
    neutral: "text-slate-700 dark:text-slate-300",
  };

  // Format target range for display
  const getTargetDisplay = () => {
    if (config.target === null) return "Track YoY growth";

    const unit = config.unit === "percentage" ? "%" : config.unit === "days" ? " days" : "";

    if (config.lowerIsBetter) {
      return `Target: ≤${config.target}${unit}`;
    }
    return `Target: ${config.target}${unit}`;
  };

  return (
    <Card className={cn(statusColors[status], statusBgColors[status], className)}>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider">
          {config.name}
        </CardDescription>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-2xl font-bold", statusTextColors[status])}>
            {formattedValue}
          </CardTitle>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trendPositive === true && "text-green-600 dark:text-green-400",
                trendPositive === false && "text-red-600 dark:text-red-400",
                trendPositive === null && "text-slate-500"
              )}
            >
              {trend === "up" && <TrendingUp className="h-4 w-4" />}
              {trend === "down" && <TrendingDown className="h-4 w-4" />}
              {trend === "stable" && <Minus className="h-4 w-4" />}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {getTargetDisplay()}
        </p>
      </CardContent>
    </Card>
  );
}

// Compact version for grid displays
export function MetricCardCompact({ metricKey, value, previousValue }: MetricCardProps) {
  const config = METRIC_CONFIG[metricKey];
  const status = getMetricStatus(metricKey, value);
  const formattedValue = formatMetricValue(metricKey, value);

  const statusDot = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    neutral: "bg-slate-400",
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", statusDot[status])} />
        <span className="text-sm text-slate-600 dark:text-slate-400">{config.name}</span>
      </div>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{formattedValue}</span>
    </div>
  );
}
