import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getFinancialMetricsData } from "@/lib/actions/financial-metrics";
import {
  METRIC_CONFIG,
  MetricKey,
  formatPeriod,
  getPreviousPeriod,
  FinancialMetricsData,
} from "@/lib/financial-metrics-utils";
import { MetricCard } from "@/components/financial-metrics/metric-card";
import { EntryDialog } from "@/components/financial-metrics/entry-dialog";
import { UpgradePrompt } from "@/components/financial-metrics/upgrade-prompt";
import { TrendingUp, Calendar, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancialMetricsPage() {
  await requirePermission(PERMISSIONS.PAYROLL);

  const data = await getFinancialMetricsData();

  // Show upgrade prompt if feature not available
  if (data?.featureNotAvailable) {
    return <UpgradePrompt />;
  }

  const metrics = data?.metrics || [];
  const currentPeriod = data?.currentPeriod || "";

  // Get current and previous period data
  const currentData = metrics.find((m: FinancialMetricsData) => m.period === currentPeriod);
  const previousPeriod = getPreviousPeriod(currentPeriod);
  const previousData = metrics.find((m: FinancialMetricsData) => m.period === previousPeriod);

  // Metric keys for iteration
  const metricKeys: MetricKey[] = [
    "revenuePerConsult",
    "billingErrorRate",
    "profitAllocation",
    "ownerPayAllocation",
    "taxReserveAllocation",
    "payrollPercentage",
    "consumablesPercentage",
    "rentPercentage",
    "overheadsPercentage",
    "medicalAidDSODays",
    "cashCollectionDays",
  ];

  // Check if we have any data
  const hasData = currentData !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Financial Metrics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track 11 key financial indicators for your practice
          </p>
        </div>
        <EntryDialog existingData={currentData} />
      </div>

      {/* Current Period Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Period</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatPeriod(currentPeriod)}
                </p>
              </div>
            </div>
            {currentData && (
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {currentData.totalRevenue
                    ? `R${currentData.totalRevenue.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`
                    : "—"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!hasData ? (
        // No Data State
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No data for {formatPeriod(currentPeriod)}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Enter your financial metrics to start tracking your practice&apos;s performance.
              </p>
              <EntryDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600 dark:text-slate-400">On Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-400">Acceptable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600 dark:text-slate-400">Needs Attention</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-slate-600 dark:text-slate-400">No Data</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {metricKeys.map((key) => (
              <MetricCard
                key={key}
                metricKey={key}
                value={currentData?.[key] ?? null}
                previousValue={previousData?.[key] ?? null}
              />
            ))}
          </div>

          {/* Metric Categories Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue & Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track revenue per consult and billing accuracy. Aim for YoY growth and
                  billing errors under 2%.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profit First Allocations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Profit (10%), Owner&apos;s Pay (30%), and Tax Reserve (20%) should total 60%
                  of revenue.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expense Ratios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Keep total overheads under 55%. Watch payroll (30%), consumables (10%),
                  and rent (12%).
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Historical Data */}
          {metrics.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historical Data</CardTitle>
                <CardDescription>Previous periods with recorded data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-medium">Period</th>
                        <th className="text-right py-2 px-3 font-medium">Revenue</th>
                        <th className="text-right py-2 px-3 font-medium">Rev/Consult</th>
                        <th className="text-right py-2 px-3 font-medium">Profit %</th>
                        <th className="text-right py-2 px-3 font-medium">Overheads %</th>
                        <th className="text-right py-2 px-3 font-medium">DSO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(0, 6).map((m: FinancialMetricsData) => (
                        <tr
                          key={m.period}
                          className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <td className="py-2 px-3">{formatPeriod(m.period)}</td>
                          <td className="text-right py-2 px-3">
                            {m.totalRevenue
                              ? `R${m.totalRevenue.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`
                              : "—"}
                          </td>
                          <td className="text-right py-2 px-3">
                            {m.revenuePerConsult ? `R${m.revenuePerConsult.toFixed(2)}` : "—"}
                          </td>
                          <td className="text-right py-2 px-3">
                            {m.profitAllocation !== null ? `${m.profitAllocation}%` : "—"}
                          </td>
                          <td className="text-right py-2 px-3">
                            {m.overheadsPercentage !== null ? `${m.overheadsPercentage}%` : "—"}
                          </td>
                          <td className="text-right py-2 px-3">
                            {m.medicalAidDSODays !== null ? `${m.medicalAidDSODays} days` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {currentData?.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Notes for {formatPeriod(currentPeriod)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {currentData.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
