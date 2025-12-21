"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, CheckCircle, XCircle, Banknote, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type Timesheet = {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  breakMinutes: number;
  hoursWorked: number | null;
  hourlyRate: number;
  totalPayable: number | null;
  status: "CLOCKED_IN" | "CLOCKED_OUT" | "APPROVED" | "REJECTED";
  paymentStatus: "UNPAID" | "PAID";
  notes: string | null;
  rejectionNote: string | null;
  paymentRef: string | null;
  paidAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
};

interface LocumTimesheetHistoryProps {
  timesheets: Timesheet[];
}

export function LocumTimesheetHistory({ timesheets }: LocumTimesheetHistoryProps) {
  const getStatusBadge = (timesheet: Timesheet) => {
    if (timesheet.paymentStatus === "PAID") {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Banknote className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    }

    switch (timesheet.status) {
      case "CLOCKED_IN":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="h-3 w-3 mr-1" />
            Clocked In
          </Badge>
        );
      case "CLOCKED_OUT":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  // Sort by date descending
  const sortedTimesheets = [...timesheets].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Clock In</TableHead>
          <TableHead>Clock Out</TableHead>
          <TableHead>Break</TableHead>
          <TableHead className="text-right">Hours</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTimesheets.map((ts) => (
          <TableRow key={ts.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                {format(new Date(ts.date), "dd MMM yyyy")}
              </div>
            </TableCell>
            <TableCell>
              {ts.clockIn ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  {format(new Date(ts.clockIn), "HH:mm")}
                </div>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {ts.clockOut ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  {format(new Date(ts.clockOut), "HH:mm")}
                </div>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {ts.breakMinutes > 0 ? `${ts.breakMinutes}m` : "-"}
            </TableCell>
            <TableCell className="text-right">
              {ts.hoursWorked?.toFixed(1) || "-"}h
            </TableCell>
            <TableCell className="text-right font-medium">
              {ts.totalPayable
                ? `R${ts.totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                : "-"}
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {getStatusBadge(ts)}
                {ts.status === "REJECTED" && ts.rejectionNote && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {ts.rejectionNote}
                  </p>
                )}
                {ts.paymentStatus === "PAID" && ts.paymentRef && (
                  <p className="text-xs text-slate-500">
                    Ref: {ts.paymentRef}
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
