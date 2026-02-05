import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileDown, FileText, CalendarDays } from "lucide-react";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { EMP201DownloadButton } from "@/components/payroll/reports/emp201-download-button";
import { EMP501DownloadButton } from "@/components/payroll/reports/emp501-download-button";
import { IRP5DownloadButton } from "@/components/payroll/reports/irp5-download-button";
import { getEmployeesWithCompensation } from "@/lib/actions/payroll";
import { getCurrentTaxYear } from "@/lib/tax-calculator";

export default async function SarsReportsPage() {
  await requirePermission(PERMISSIONS.PAYROLL_FULL);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentTaxYear = getCurrentTaxYear(currentMonth, currentYear);

  const employees = await getEmployeesWithCompensation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">SARS Reports</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Generate statutory reports for SARS compliance
          </p>
        </div>
      </div>

      {/* Tax Year Info */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Current Tax Year</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{currentTaxYear}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                March 1, {currentTaxYear.split("/")[0]} - February 28/29, {currentTaxYear.split("/")[1]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EMP201 - Monthly Declaration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                EMP201 - Monthly Employer Declaration
              </CardTitle>
              <CardDescription className="mt-2">
                Monthly declaration of PAYE, UIF, and SDL. Due by the 7th of the following month.
              </CardDescription>
            </div>
            <Badge variant="outline">Monthly</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Month</label>
              <EMP201DownloadButton />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">What's included:</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Total PAYE for the month</li>
                <li>• Total UIF (employee + employer)</li>
                <li>• Total SDL (employer contribution)</li>
                <li>• Total amount due to SARS</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EMP501 - Annual Reconciliation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                EMP501 - Annual Employer Reconciliation
              </CardTitle>
              <CardDescription className="mt-2">
                Annual reconciliation declaration for the tax year. Due by May 31 following the tax year.
              </CardDescription>
            </div>
            <Badge variant="outline">Annual</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Tax Year</label>
              <EMP501DownloadButton />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">What's included:</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• All employees for the tax year</li>
                <li>• YTD gross, taxable income, PAYE</li>
                <li>• YTD UIF, pension, medical aid</li>
                <li>• Totals and summary</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IRP5 - Individual Tax Certificates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                IRP5 - Individual Tax Certificates
              </CardTitle>
              <CardDescription className="mt-2">
                Individual tax certificates for employees. Required for employee tax returns.
              </CardDescription>
            </div>
            <Badge variant="outline">Per Employee</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Employee & Tax Year</label>
              <IRP5DownloadButton employees={employees} />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">What's included:</h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Gross remuneration</li>
                <li>• Taxable income & fringe benefits</li>
                <li>• PAYE, UIF, pension, medical aid</li>
                <li>• Medical tax credits applied</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Notes</h3>
          <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>EMP201:</strong> Must be submitted monthly, even if there are no employees or amounts are R0</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>EMP501:</strong> Annual reconciliation must be submitted by May 31 after the tax year ends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><strong>IRP5:</strong> Must be issued to employees by May 31 and submitted to SARS with EMP501</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>All reports download as CSV files compatible with SARS eFiling portal</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
