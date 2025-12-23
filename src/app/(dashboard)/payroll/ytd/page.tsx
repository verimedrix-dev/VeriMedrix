import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingUp, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getPracticeYTD } from "@/lib/actions/payroll-ytd";
import { getCurrentTaxYear } from "@/lib/tax-calculator";

type SearchParams = Promise<{ taxYear?: string }>;

export default async function YTDDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  await requirePermission(PERMISSIONS.PAYROLL);

  const params = await searchParams;
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentTaxYear = getCurrentTaxYear(currentMonth, currentYear);

  const selectedTaxYear = params.taxYear || currentTaxYear;

  const ytdData = await getPracticeYTD(selectedTaxYear);

  // Calculate totals
  const totals = ytdData.reduce(
    (acc, emp) => ({
      gross: acc.gross + Number(emp.ytdGross),
      taxable: acc.taxable + Number(emp.ytdTaxableIncome),
      paye: acc.paye + Number(emp.ytdPaye),
      uif: acc.uif + Number(emp.ytdUifEmployee),
      retirement: acc.retirement + Number(emp.ytdRetirement),
      medicalAid: acc.medicalAid + Number(emp.ytdMedicalAid),
    }),
    { gross: 0, taxable: 0, paye: 0, uif: 0, retirement: 0, medicalAid: 0 }
  );

  // Generate tax year options (last 5 years)
  const taxYears: string[] = [];
  const [startYear] = currentTaxYear.split("/").map(Number);
  for (let i = 0; i < 5; i++) {
    const year = startYear - i;
    taxYears.push(`${year}/${year + 1}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payroll">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Year-to-Date Summary
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Employee earnings and deductions for the tax year
            </p>
          </div>
        </div>

        {/* Tax Year Selector */}
        <form action="/payroll/ytd" method="get">
          <Select name="taxYear" defaultValue={selectedTaxYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taxYears.map((ty) => (
                <SelectItem key={ty} value={ty}>
                  {ty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>
      </div>

      {/* Tax Year Info */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Selected Tax Year</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedTaxYear}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                March 1, {selectedTaxYear.split("/")[0]} - February 28/29, {selectedTaxYear.split("/")[1]}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Gross YTD</p>
                <p className="text-2xl font-bold text-green-600">
                  R {totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total PAYE YTD</p>
                <p className="text-2xl font-bold text-blue-600">
                  R {totals.paye.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Employees</p>
                <p className="text-2xl font-bold text-amber-600">{ytdData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee YTD Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Year-to-Date Breakdown</CardTitle>
          <CardDescription>
            Individual earnings and deductions for {selectedTaxYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ytdData.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No YTD data for this tax year</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                YTD data is created when payroll runs are processed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Gross YTD</TableHead>
                  <TableHead className="text-right">Taxable YTD</TableHead>
                  <TableHead className="text-right">PAYE YTD</TableHead>
                  <TableHead className="text-right">UIF YTD</TableHead>
                  <TableHead className="text-right">Retirement YTD</TableHead>
                  <TableHead className="text-right">Medical Aid YTD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ytdData.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{emp.Employee.fullName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {emp.Employee.employeeNumber && (
                            <Badge variant="outline" className="text-xs">
                              {emp.Employee.employeeNumber}
                            </Badge>
                          )}
                          {emp.Employee.taxNumber && (
                            <span className="text-xs text-slate-500">
                              Tax: {emp.Employee.taxNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R {Number(emp.ytdGross).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(emp.ytdTaxableIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      R {Number(emp.ytdPaye).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(emp.ytdUifEmployee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(emp.ytdRetirement).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(emp.ytdMedicalAid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals Row */}
                <TableRow className="bg-slate-50 dark:bg-slate-800 font-bold">
                  <TableCell>TOTALS</TableCell>
                  <TableCell className="text-right">
                    R {totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R {totals.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-blue-600">
                    R {totals.paye.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R {totals.uif.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R {totals.retirement.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R {totals.medicalAid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
