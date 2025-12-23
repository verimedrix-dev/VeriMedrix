"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Info } from "lucide-react";
import { validatePayrollRun } from "@/lib/actions/payroll";
import type { PayrollValidationResult } from "@/lib/payroll-compliance";

type PayrollValidationWarningsProps = {
  payrollRunId: string;
};

export function PayrollValidationWarnings({ payrollRunId }: PayrollValidationWarningsProps) {
  const [validation, setValidation] = useState<PayrollValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadValidation() {
      try {
        const result = await validatePayrollRun(payrollRunId);
        setValidation(result);
      } catch (error) {
        console.error("Failed to load validation:", error);
      } finally {
        setLoading(false);
      }
    }
    loadValidation();
  }, [payrollRunId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-300">All checks passed</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          No validation errors or warnings. Payroll is ready to be processed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Errors */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>
            {validation.errors.length} Critical {validation.errors.length === 1 ? "Error" : "Errors"}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {validation.errors.map((error, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-red-100 dark:bg-red-950 rounded border border-red-200 dark:border-red-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-red-900 dark:text-red-100">
                      {error.employeeName}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-red-300 dark:border-red-700">
                    {error.field}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-medium text-red-900 dark:text-red-100">
              Fix these errors before processing payroll.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">
            {validation.warnings.length} {validation.warnings.length === 1 ? "Warning" : "Warnings"}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {validation.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-amber-100 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-amber-900 dark:text-amber-100">
                      {warning.employeeName}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{warning.message}</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-700">
                    {warning.field}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
              These warnings won't prevent processing, but you may want to review them.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
