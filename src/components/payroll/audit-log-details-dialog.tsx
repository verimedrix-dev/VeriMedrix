"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Calendar, User, FileText } from "lucide-react";

type AuditLog = {
  id: string;
  calculationTimestamp: Date;
  grossRemuneration: any;
  taxableIncome: any;
  payeCalculated: any;
  uifEmployee: any;
  uifEmployer: any;
  sdl: any;
  calculationBreakdown: any;
  appliedRebates: any;
  medicalCredits: any;
  fringeBenefits: any;
  taxYear: string;
  Employee: {
    fullName: string;
    employeeNumber: string | null;
  };
};

type AuditLogDetailsDialogProps = {
  log: AuditLog;
};

export function AuditLogDetailsDialog({ log }: AuditLogDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  const breakdown = log.calculationBreakdown as any;
  const rebates = log.appliedRebates as any;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Complete PAYE calculation breakdown for {log.Employee.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Employee</p>
                <p className="font-medium">{log.Employee.fullName}</p>
                {log.Employee.employeeNumber && (
                  <p className="text-xs text-slate-500">{log.Employee.employeeNumber}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Calculated</p>
                <p className="font-medium">
                  {new Date(log.calculationTimestamp).toLocaleString()}
                </p>
                <Badge variant="outline" className="mt-1">
                  {log.taxYear}
                </Badge>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm mb-3">Financial Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Gross Remuneration</p>
                <p className="font-medium">R {Number(log.grossRemuneration).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">Taxable Income</p>
                <p className="font-medium">R {Number(log.taxableIncome).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">PAYE Calculated</p>
                <p className="font-bold text-green-600">R {Number(log.payeCalculated).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">UIF (Employee)</p>
                <p className="font-medium">R {Number(log.uifEmployee).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">UIF (Employer)</p>
                <p className="font-medium">R {Number(log.uifEmployer).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500">SDL (Employer)</p>
                <p className="font-medium">R {Number(log.sdl).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Calculation Breakdown */}
          {breakdown && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm">Detailed Breakdown</h4>
              </div>

              {breakdown.deductions && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase mb-2">Deductions</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>PAYE:</span>
                        <span className="font-medium">R {breakdown.deductions.paye?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UIF:</span>
                        <span className="font-medium">R {breakdown.deductions.uif?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pension:</span>
                        <span className="font-medium">R {breakdown.deductions.pension?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medical Aid:</span>
                        <span className="font-medium">R {breakdown.deductions.medicalAid?.toFixed(2) || "0.00"}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-bold">
                        <span>Total Deductions:</span>
                        <span className="text-red-600">R {breakdown.deductions.total?.toFixed(2) || "0.00"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                    <div className="flex justify-between font-bold text-green-900 dark:text-green-100">
                      <span>Net Salary:</span>
                      <span>R {breakdown.netSalary?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rebates Applied */}
          {rebates && rebates.note && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Rebates:</strong> {rebates.note}
              </p>
            </div>
          )}

          {/* Fringe Benefits */}
          {log.fringeBenefits && Number(log.fringeBenefits) > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Fringe Benefits:</strong> R {Number(log.fringeBenefits).toFixed(2)} added to taxable income
              </p>
            </div>
          )}

          {/* Medical Tax Credits */}
          {log.medicalCredits && Number(log.medicalCredits) > 0 && (
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Medical Tax Credits:</strong> R {Number(log.medicalCredits).toFixed(2)} deducted from PAYE
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
