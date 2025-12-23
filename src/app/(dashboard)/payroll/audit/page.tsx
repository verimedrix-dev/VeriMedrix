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
import { ArrowLeft, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getPayrollAuditLogs } from "@/lib/actions/payroll-audit";
import { AuditLogDetailsDialog } from "@/components/payroll/audit-log-details-dialog";

export default async function PayrollAuditPage() {
  await requirePermission(PERMISSIONS.PAYROLL);

  const auditLogs = await getPayrollAuditLogs();

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Audit Trail</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Complete calculation history and compliance records
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Audit Log Purpose</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Immutable records of all payroll calculations for SARS compliance and CA verification.
                Each entry contains a detailed step-by-step breakdown of PAYE calculations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {auditLogs.length} audit {auditLogs.length === 1 ? "entry" : "entries"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No audit logs yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Audit logs are created when payroll runs are processed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Tax Year</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                  <TableHead className="text-right">PAYE</TableHead>
                  <TableHead className="text-right">UIF (Emp)</TableHead>
                  <TableHead className="text-right">SDL</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(log.calculationTimestamp).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(log.calculationTimestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.Employee.fullName}</p>
                        <p className="text-xs text-slate-500">{log.Employee.employeeNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.taxYear}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(log.grossRemuneration).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(log.taxableIncome).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R {Number(log.payeCalculated).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(log.uifEmployee).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R {Number(log.sdl).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <AuditLogDetailsDialog log={log} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
