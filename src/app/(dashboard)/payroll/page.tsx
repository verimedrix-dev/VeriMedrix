import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  DollarSign,
  Calculator,
  FileSpreadsheet,
  AlertTriangle,
  PlayCircle,
  TrendingUp,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { getEmployeesWithCompensation, getPayrollRuns, getSarsSummary } from "@/lib/actions/payroll";
import { format } from "date-fns";
import { SarsReminderCard } from "@/components/payroll/sars-reminder-card";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getPayAdvances } from "@/lib/actions/pay-advance";
import { PayAdvanceManagement } from "@/components/payroll/pay-advance-management";

// Dynamic import for dialogs - not needed on initial render
const CompensationDialog = dynamic(
  () => import("@/components/payroll/compensation-dialog").then((mod) => mod.CompensationDialog),
  {
    loading: () => <Skeleton className="h-8 w-20" />,
  }
);

const FringeBenefitsDialog = dynamic(
  () => import("@/components/payroll/fringe-benefits-dialog").then((mod) => mod.FringeBenefitsDialog),
  {
    loading: () => <Skeleton className="h-8 w-20" />,
  }
);

const GarnisheeDeductionDialog = dynamic(
  () => import("@/components/payroll/garnishee-deduction-dialog").then((mod) => mod.GarnisheeDeductionDialog),
  {
    loading: () => <Skeleton className="h-8 w-20" />,
  }
);

const RequestPayAdvanceDialog = dynamic(
  () => import("@/components/payroll/request-pay-advance-dialog").then((mod) => mod.RequestPayAdvanceDialog),
  {
    loading: () => <Skeleton className="h-8 w-20" />,
  }
);

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Not set";
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function PayrollPage() {
  // Only managers and above can access the full payroll management page
  // Staff can only view their own payslips via a different view
  await requirePermission(PERMISSIONS.PAYROLL_FULL);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [employees, payrollRuns, sarsSummary, payAdvances] = await Promise.all([
    getEmployeesWithCompensation(),
    getPayrollRuns(currentYear),
    getSarsSummary(currentMonth - 1 || 12, currentMonth === 1 ? currentYear - 1 : currentYear),
    getPayAdvances(),
  ]);

  // Calculate totals
  const employeesWithSalary = employees.filter((e) => e.grossSalary);
  const totalMonthlyGross = employeesWithSalary.reduce((sum, e) => sum + (e.grossSalary || 0), 0);
  const currentPayroll = payrollRuns.find((p) => p.month === currentMonth && p.year === currentYear);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage employee compensation, run payroll, and generate reports
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/payroll/ytd">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              YTD
            </Button>
          </Link>
          <Link href="/payroll/audit">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Audit Trail
            </Button>
          </Link>
          <Link href="/payroll/reports">
            <Button variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              SARS Reports
            </Button>
          </Link>
          <Link href="/payroll/run">
            <Button>
              <PlayCircle className="h-4 w-4 mr-2" />
              Run Payroll
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employeesWithSalary.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Employees on Payroll</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalMonthlyGross)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Monthly Gross</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <Calculator className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{payrollRuns.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Payroll Runs ({currentYear})</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Badge
                  className={
                    currentPayroll?.status === "PAID"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : currentPayroll?.status === "PROCESSED"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                  }
                >
                  {currentPayroll?.status || "Not Started"}
                </Badge>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {format(currentDate, "MMMM yyyy")} Payroll
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SARS Reminder */}
      {sarsSummary && <SarsReminderCard summary={sarsSummary} />}

      {/* Main Content */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees" className="cursor-pointer">
            <Users className="h-4 w-4 mr-2" />
            Employee Compensation
          </TabsTrigger>
          <TabsTrigger value="advances" className="cursor-pointer">
            <DollarSign className="h-4 w-4 mr-2" />
            Pay Advances
          </TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Payroll History
          </TabsTrigger>
        </TabsList>

        {/* Employee Compensation Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Compensation</CardTitle>
              <CardDescription>
                Manage salary information and deductions for each employee
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No employees found</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Add employees in the Employees section first
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="text-right">Gross Salary</TableHead>
                      <TableHead>Pay Frequency</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead className="text-right">Est. Net</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const totalDeductions = employee.EmployeeDeduction.reduce((sum, d) => {
                        if (d.deductionType === "PENSION" && d.percentage && employee.grossSalary) {
                          return sum + (employee.grossSalary * (d.percentage / 100));
                        }
                        return sum + (d.amount || 0);
                      }, 0);

                      // Add UIF if not exempt and has salary
                      const uifDeduction = employee.uifExempt ? 0 :
                        Math.min((employee.grossSalary || 0) * 0.01, 177.12);

                      const estimatedNet = (employee.grossSalary || 0) - totalDeductions - uifDeduction;

                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{employee.fullName}</p>
                              {employee.employeeNumber && (
                                <p className="text-xs text-slate-500">#{employee.employeeNumber}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{employee.position}</TableCell>
                          <TableCell className="text-right">
                            {employee.grossSalary ? (
                              <span className="font-medium">{formatCurrency(employee.grossSalary)}</span>
                            ) : (
                              <Badge variant="outline" className="text-amber-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Not set
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {employee.payFrequency ? (
                              <Badge variant="secondary">
                                {employee.payFrequency.toLowerCase()}
                              </Badge>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {employee.EmployeeDeduction.length} active
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {employee.grossSalary ? (
                              <span className="font-medium text-green-600">
                                {formatCurrency(estimatedNet)}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <CompensationDialog employee={employee} />
                              <FringeBenefitsDialog employeeId={employee.id} employeeName={employee.fullName} />
                              <GarnisheeDeductionDialog employeeId={employee.id} employeeName={employee.fullName} />
                              {employee.grossSalary && (
                                <RequestPayAdvanceDialog
                                  employeeId={employee.id}
                                  employeeName={employee.fullName}
                                  monthlySalary={employee.grossSalary}
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pay Advances Tab */}
        <TabsContent value="advances">
          <PayAdvanceManagement advances={payAdvances} />
        </TabsContent>

        {/* Payroll History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payroll History ({currentYear})</CardTitle>
                <CardDescription>
                  View past payroll runs and download reports
                </CardDescription>
              </div>
              <Link href="/payroll/history">
                <Button variant="outline" size="sm">
                  View All History
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {payrollRuns.length === 0 ? (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No payroll runs yet</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Run your first payroll to get started
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Total Gross</TableHead>
                      <TableHead className="text-right">Total Deductions</TableHead>
                      <TableHead className="text-right">Total Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <span className="font-medium">
                            {format(new Date(run.year, run.month - 1, 1), "MMMM yyyy")}
                          </span>
                        </TableCell>
                        <TableCell>{run.PayrollEntry.length}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(run.totalGross)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(run.totalDeductions)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(run.totalNet)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              run.status === "PAID"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                : run.status === "PROCESSED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                            }
                          >
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/payroll/run?month=${run.month}&year=${run.year}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
