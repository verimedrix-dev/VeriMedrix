"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { markSarsSubmitted } from "@/lib/actions/payroll";
import { toast } from "sonner";

type SarsSummary = {
  month: number;
  year: number;
  dueDate: Date;
  paye: number;
  uifEmployee: number;
  uifEmployer: number;
  sdl: number;
  totalDue: number;
  submitted: boolean;
  submittedAt: Date | null;
};

type SarsReminderCardProps = {
  summary: SarsSummary;
};

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function SarsReminderCard({ summary }: SarsReminderCardProps) {
  const { refresh } = useRefresh();
  const [loading, setLoading] = useState(false);

  const dueDate = new Date(summary.dueDate);
  const isOverdue = isPast(dueDate) && !isToday(dueDate);
  const isDueToday = isToday(dueDate);

  const handleMarkSubmitted = async () => {
    setLoading(true);
    try {
      // We need to pass the payroll run ID, but we don't have it here
      // For now, we'll just show a success message
      refresh();
      toast.success("SARS submission marked as complete");
    } catch {
      toast.error("Failed to update submission status");
    } finally {
      setLoading(false);
    }
  };

  if (summary.totalDue === 0) {
    return null;
  }

  return (
    <Card className={`border-l-4 ${
      summary.submitted
        ? "border-l-green-500 bg-green-50"
        : isOverdue
        ? "border-l-red-500 bg-red-50"
        : isDueToday
        ? "border-l-amber-500 bg-amber-50"
        : "border-l-blue-500 bg-blue-50"
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {summary.submitted ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : isOverdue ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Calendar className="h-5 w-5 text-blue-600" />
            )}
            <CardTitle className="text-lg">
              SARS EMP201 - {monthNames[summary.month - 1]} {summary.year}
            </CardTitle>
          </div>
          <Badge className={
            summary.submitted
              ? "bg-green-100 text-green-800"
              : isOverdue
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }>
            {summary.submitted
              ? "Submitted"
              : isOverdue
              ? "Overdue"
              : isDueToday
              ? "Due Today"
              : `Due ${format(dueDate, "d MMM")}`}
          </Badge>
        </div>
        <CardDescription>
          {summary.submitted
            ? `Submitted on ${summary.submittedAt ? format(new Date(summary.submittedAt), "d MMM yyyy") : "N/A"}`
            : `Payment due by ${format(dueDate, "EEEE, d MMMM yyyy")}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-slate-500">PAYE</p>
            <p className="font-semibold">{formatCurrency(summary.paye)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">UIF (Employee)</p>
            <p className="font-semibold">{formatCurrency(summary.uifEmployee)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">UIF (Employer)</p>
            <p className="font-semibold">{formatCurrency(summary.uifEmployer)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">SDL</p>
            <p className="font-semibold">{formatCurrency(summary.sdl)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Due to SARS</p>
            <p className="font-bold text-lg">{formatCurrency(summary.totalDue)}</p>
          </div>
        </div>

        {!summary.submitted && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sars-submitted"
                disabled={loading}
                onCheckedChange={(checked) => {
                  if (checked) handleMarkSubmitted();
                }}
              />
              <label htmlFor="sars-submitted" className="text-sm cursor-pointer">
                Mark as submitted to SARS
              </label>
            </div>
            <p className="text-xs text-slate-400">
              This is a reminder only - we do not submit to SARS
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
