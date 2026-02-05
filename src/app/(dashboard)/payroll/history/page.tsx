import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileSpreadsheet, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { getPayrollRuns, getPayrollHistory } from "@/lib/actions/payroll";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { format } from "date-fns";

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "R 0.00";
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function PayrollHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; employeeId?: string }>;
}) {
  await requirePermission(PERMISSIONS.PAYROLL_FULL);

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const selectedYear = params.year ? parseInt(params.year) : currentYear;

  const payrollRuns = await getPayrollRuns(selectedYear);
  const employeeHistory = params.employeeId
    ? await getPayrollHistory(params.employeeId)
    : null;

  // Calculate year-over-year stats
  const totalGrossForYear = payrollRuns.reduce((sum, run) => sum + run.totalGross, 0);
  const totalNetForYear = payrollRuns.reduce((sum, run) => sum + run.totalNet, 0);
  const avgMonthlyPayroll = payrollRuns.length > 0 ? totalGrossForYear / payrollRuns.length : 0;

  // Available years (current year and 5 years back)
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payroll History</h1>
          <p className="text-slate-500 dark:text-slate-400">
            View historical payroll data and trends
          </p>
        </div>
        <form>
          <Select name="year" defaultValue={selectedYear.toString()}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
      </div>

      {/* Year Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Payroll Runs</p>
            <p className="text-2xl font-bold dark:text-white">{payrollRuns.length}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">in {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Gross Paid</p>
            <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalGrossForYear)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">YTD {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Net Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalNetForYear)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">YTD {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Avg Monthly Payroll</p>
            <p className="text-2xl font-bold dark:text-white">{formatCurrency(avgMonthlyPayroll)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">gross per month</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown - {selectedYear}</CardTitle>
          <CardDescription>
            Detailed view of each payroll run
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRuns.length === 0 ? (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No payroll runs found for {selectedYear}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Employer Costs</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.map((run, index) => {
                  const prevRun = payrollRuns[index + 1];
                  const change = prevRun
                    ? ((run.totalGross - prevRun.totalGross) / prevRun.totalGross) * 100
                    : null;

                  return (
                    <TableRow key={run.id}>
                      <TableCell>
                        <span className="font-medium">
                          {format(new Date(run.year, run.month - 1, 1), "MMMM")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {run.PayrollEntry.length}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(run.totalGross)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(run.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        {formatCurrency(run.totalEmployerUif + run.totalEmployerSdl)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(run.totalNet)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            run.status === "PAID"
                              ? "bg-green-100 text-green-800"
                              : run.status === "PROCESSED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {change !== null ? (
                          <div className="flex items-center justify-end gap-1">
                            {change > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : change < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : null}
                            <span className={change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : ""}>
                              {change > 0 ? "+" : ""}{change.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/payroll/run?month=${run.month}&year=${run.year}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* SARS Summary */}
      {payrollRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SARS Summary - {selectedYear}</CardTitle>
            <CardDescription>
              Annual totals for tax submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total PAYE</p>
                <p className="text-xl font-bold dark:text-white">
                  {formatCurrency(
                    payrollRuns.reduce(
                      (sum, run) =>
                        sum +
                        run.PayrollEntry.reduce((s, e) => s + e.payeAmount, 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total UIF (Employee)</p>
                <p className="text-xl font-bold dark:text-white">
                  {formatCurrency(
                    payrollRuns.reduce(
                      (sum, run) =>
                        sum +
                        run.PayrollEntry.reduce((s, e) => s + e.uifAmount, 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total UIF (Employer)</p>
                <p className="text-xl font-bold dark:text-white">
                  {formatCurrency(
                    payrollRuns.reduce((sum, run) => sum + run.totalEmployerUif, 0)
                  )}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total SDL</p>
                <p className="text-xl font-bold dark:text-white">
                  {formatCurrency(
                    payrollRuns.reduce((sum, run) => sum + run.totalEmployerSdl, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
