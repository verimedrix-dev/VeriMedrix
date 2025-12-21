"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  CheckCircle,
  DollarSign,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  updatePayrollRunStatus,
  createOrUpdatePayrollRun,
  generateBankExport,
  generateAccountantExport,
} from "@/lib/actions/payroll";
import type { PayrollStatus } from "@prisma/client";

type PayrollRun = {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  PayrollEntry: Array<{
    id: string;
    Employee: {
      id: string;
      fullName: string;
      bankName: string | null;
      bankAccountNumber: string | null;
      bankBranchCode: string | null;
    };
  }>;
};

type PayrollRunActionsProps = {
  payrollRun: PayrollRun;
};

export function PayrollRunActions({ payrollRun }: PayrollRunActionsProps) {
  const { refresh } = useRefresh();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (status: PayrollStatus) => {
    setLoading(status);
    try {
      await updatePayrollRunStatus(payrollRun.id, status);
      refresh();
      toast.success(`Payroll marked as ${status.toLowerCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  const handleRecalculate = async () => {
    setLoading("recalculate");
    try {
      await createOrUpdatePayrollRun(payrollRun.month, payrollRun.year);
      refresh();
      toast.success("Payroll recalculated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to recalculate");
    } finally {
      setLoading(null);
    }
  };

  const handleBankExport = async () => {
    setLoading("bank");
    try {
      const csv = await generateBankExport(payrollRun.id);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bank-payment-${payrollRun.year}-${String(payrollRun.month).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Bank export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate export");
    } finally {
      setLoading(null);
    }
  };

  const handleAccountantExport = async () => {
    setLoading("accountant");
    try {
      const csv = await generateAccountantExport(payrollRun.id);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-${payrollRun.year}-${String(payrollRun.month).padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Accountant export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate export");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>
          Manage this payroll run and export reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Status Actions */}
          {payrollRun.status === "DRAFT" && (
            <>
              <Button
                variant="outline"
                onClick={handleRecalculate}
                disabled={loading !== null}
              >
                {loading === "recalculate" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Recalculate
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={loading !== null}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Processed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Payroll as Processed?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will lock the payroll run. You won't be able to make changes
                      after marking it as processed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange("PROCESSED")}>
                      {loading === "PROCESSED" && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {payrollRun.status === "PROCESSED" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700" disabled={loading !== null}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark Payroll as Paid?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This confirms that all employees have been paid for this period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange("PAID")}>
                    {loading === "PAID" && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Confirm Payment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Export Actions - Always available */}
          <div className="flex-1" />

          <Button
            variant="outline"
            onClick={handleBankExport}
            disabled={loading !== null}
          >
            {loading === "bank" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-2" />
            )}
            Bank Export (CSV)
          </Button>

          <Button
            variant="outline"
            onClick={handleAccountantExport}
            disabled={loading !== null}
          >
            {loading === "accountant" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Accountant Export
          </Button>
        </div>

        {payrollRun.status === "PAID" && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              This payroll has been marked as paid. All records are locked.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
