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
import { ArrowLeft, FileDown, CheckCircle, DollarSign, Calculator, Users } from "lucide-react";
import Link from "next/link";
import { getPayrollRun, getEmployeesWithCompensation } from "@/lib/actions/payroll";
import { format } from "date-fns";
import { PayrollRunActions } from "@/components/payroll/payroll-run-actions";
import { GeneratePayrollButton } from "@/components/payroll/generate-payroll-button";
import { PayslipDownloadButton } from "@/components/payroll/payslip-download-button";
import { PayrollValidationWarnings } from "@/components/payroll/payroll-validation-warnings";
import { IrregularPaymentDialog } from "@/components/payroll/irregular-payment-dialog";

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "R 0.00";
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function PayrollRunPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const currentDate = new Date();
  const month = params.month ? parseInt(params.month) : currentDate.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : currentDate.getFullYear();

  const [payrollRun, employees] = await Promise.all([
    getPayrollRun(month, year),
    getEmployeesWithCompensation(),
  ]);

  const employeesWithSalary = employees.filter((e) => e.grossSalary);
  const periodName = format(new Date(year, month - 1, 1), "MMMM yyyy");

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Payroll Run - {periodName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {payrollRun
              ? `${payrollRun.PayrollEntry.length} employees processed`
              : `${employeesWithSalary.length} employees ready for payroll`}
          </p>
        </div>
        {payrollRun && (
          <Badge
            className={
              payrollRun.status === "PAID"
                ? "bg-green-100 text-green-800"
                : payrollRun.status === "PROCESSED"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }
          >
            {payrollRun.status}
          </Badge>
        )}
      </div>

      {/* No payroll yet - show generate button */}
      {!payrollRun ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate Payroll</CardTitle>
            <CardDescription>
              Create the payroll run for {periodName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {employeesWithSalary.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No employees with salary data</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Configure employee compensation in the Payroll page first
                </p>
                <Link href="/payroll">
                  <Button variant="outline" className="mt-4">
                    Go to Payroll
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  This will calculate payroll for {employeesWithSalary.length} employees with
                  configured salaries. The following will be calculated:
                </p>
                <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400 space-y-1">
                  <li>Gross salary for each employee</li>
                  <li><strong>PAYE</strong> (auto-calculated using SARS tax tables)</li>
                  <li><strong>UIF</strong> (auto-calculated at 1%, capped at R177.12)</li>
                  <li>Pension, medical aid, and custom deductions</li>
                  <li>Net salary after deductions</li>
                  <li>Employer contributions (UIF and SDL)</li>
                </ul>
                <GeneratePayrollButton month={month} year={year} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold dark:text-white">{payrollRun.PayrollEntry.length}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Employees</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold dark:text-white">{formatCurrency(payrollRun.totalGross)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Gross</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Calculator className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold dark:text-white">{formatCurrency(payrollRun.totalDeductions)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Deductions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold dark:text-white">{formatCurrency(payrollRun.totalNet)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Net Pay</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileDown className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold dark:text-white">
                      {formatCurrency(payrollRun.totalEmployerUif + payrollRun.totalEmployerSdl)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Employer Contrib.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Warnings */}
          {payrollRun.status === "DRAFT" && (
            <PayrollValidationWarnings payrollRunId={payrollRun.id} />
          )}

          {/* Actions */}
          <PayrollRunActions payrollRun={payrollRun} />

          {/* Payroll Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payroll Details</CardTitle>
              <CardDescription>
                Individual employee breakdown for {periodName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">PAYE</TableHead>
                    <TableHead className="text-right">UIF</TableHead>
                    <TableHead className="text-right">Pension</TableHead>
                    <TableHead className="text-right">Medical</TableHead>
                    <TableHead className="text-right">Other</TableHead>
                    <TableHead className="text-right">Total Ded.</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    {payrollRun.status === "DRAFT" && <TableHead className="text-center">Actions</TableHead>}
                    <TableHead className="text-center">Payslip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRun.PayrollEntry.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium dark:text-white">{entry.Employee.fullName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {entry.Employee.position}
                          </p>
                          {entry.PayrollAddition && entry.PayrollAddition.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.PayrollAddition.map((addition) => (
                                <Badge key={addition.id} variant="secondary" className="text-xs">
                                  +R{addition.amount.toFixed(2)} {addition.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.grossSalary)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.payeAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.uifAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.pensionAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.medicalAidAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.otherDeductions)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(entry.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        {formatCurrency(entry.netSalary)}
                      </TableCell>
                      {payrollRun.status === "DRAFT" && (
                        <TableCell className="text-center">
                          <IrregularPaymentDialog
                            entryId={entry.id}
                            employeeName={entry.Employee.fullName}
                            additions={entry.PayrollAddition || []}
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <PayslipDownloadButton
                          payrollEntryId={entry.id}
                          employeeName={entry.Employee.fullName}
                          month={month}
                          year={year}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-slate-50 dark:bg-slate-800 font-bold">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(payrollRun.totalGross)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        payrollRun.PayrollEntry.reduce((sum, e) => sum + e.payeAmount, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        payrollRun.PayrollEntry.reduce((sum, e) => sum + e.uifAmount, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        payrollRun.PayrollEntry.reduce((sum, e) => sum + e.pensionAmount, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        payrollRun.PayrollEntry.reduce((sum, e) => sum + e.medicalAidAmount, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        payrollRun.PayrollEntry.reduce((sum, e) => sum + e.otherDeductions, 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(payrollRun.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(payrollRun.totalNet)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Employer Contributions */}
          <Card>
            <CardHeader>
              <CardTitle>Employer Contributions</CardTitle>
              <CardDescription>
                Additional costs paid by the employer (not deducted from employees)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">UIF (Employer 1%)</p>
                  <p className="text-2xl font-bold dark:text-white">{formatCurrency(payrollRun.totalEmployerUif)}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400">SDL (1% of gross)</p>
                  <p className="text-2xl font-bold dark:text-white">{formatCurrency(payrollRun.totalEmployerSdl)}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-sm text-purple-600 dark:text-purple-400">Total Employer Cost</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(payrollRun.totalEmployerUif + payrollRun.totalEmployerSdl)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
