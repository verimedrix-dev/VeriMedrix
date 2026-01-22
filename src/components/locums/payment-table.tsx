"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Building2, User, ChevronDown, ChevronRight, Clock, Calendar, Banknote, Mail, Loader2 } from "lucide-react";
import { markTimesheetsPaid, sendLocumPaymentReport } from "@/lib/actions/locums";
import { toast } from "sonner";
import { format } from "date-fns";

type Locum = {
  id: string;
  fullName: string;
  sourceType: "DIRECT" | "AGENCY";
  agencyName: string | null;
};

type Timesheet = {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  hoursWorked: number | null;
  totalPayable: number | null;
  hourlyRate: number;
};

type LocumPayment = {
  locum: Locum;
  timesheets: Timesheet[];
  totalHours: number;
  totalPayable: number;
};

interface PaymentTableProps {
  locumPayments: LocumPayment[];
  canManage: boolean;
}

export function PaymentTable({ locumPayments, canManage }: PaymentTableProps) {
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<string>>(new Set());
  const [expandedLocums, setExpandedLocums] = useState<Set<string>>(new Set());
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // Get all timesheet IDs
  const allTimesheetIds = locumPayments.flatMap(lp => lp.timesheets.map(ts => ts.id));

  const toggleLocumExpand = (locumId: string) => {
    const newExpanded = new Set(expandedLocums);
    if (newExpanded.has(locumId)) {
      newExpanded.delete(locumId);
    } else {
      newExpanded.add(locumId);
    }
    setExpandedLocums(newExpanded);
  };

  const toggleTimesheetSelection = (timesheetId: string) => {
    const newSelected = new Set(selectedTimesheets);
    if (newSelected.has(timesheetId)) {
      newSelected.delete(timesheetId);
    } else {
      newSelected.add(timesheetId);
    }
    setSelectedTimesheets(newSelected);
  };

  const toggleLocumTimesheets = (locumPayment: LocumPayment) => {
    const newSelected = new Set(selectedTimesheets);
    const locumTimesheetIds = locumPayment.timesheets.map(ts => ts.id);
    const allSelected = locumTimesheetIds.every(id => selectedTimesheets.has(id));

    if (allSelected) {
      locumTimesheetIds.forEach(id => newSelected.delete(id));
    } else {
      locumTimesheetIds.forEach(id => newSelected.add(id));
    }
    setSelectedTimesheets(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTimesheets.size === allTimesheetIds.length) {
      setSelectedTimesheets(new Set());
    } else {
      setSelectedTimesheets(new Set(allTimesheetIds));
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedTimesheets.size === 0) return;

    setIsProcessing(true);
    try {
      const result = await markTimesheetsPaid(Array.from(selectedTimesheets), paymentRef || undefined);
      if (result.success) {
        toast.success(`${selectedTimesheets.size} timesheet(s) marked as paid`);
        setSelectedTimesheets(new Set());
        setPaymentRef("");
        setIsPaymentDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to process payment");
      }
    } catch {
      toast.error("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendPaymentReport = async (locumPayment: LocumPayment) => {
    setSendingEmail(locumPayment.locum.id);
    try {
      const timesheetIds = locumPayment.timesheets.map(ts => ts.id);
      const result = await sendLocumPaymentReport(locumPayment.locum.id, timesheetIds);
      if (result.success) {
        toast.success(`Payment report sent to ${locumPayment.locum.fullName}`);
      } else {
        toast.error(result.error || "Failed to send payment report");
      }
    } catch {
      toast.error("Failed to send payment report");
    } finally {
      setSendingEmail(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      {canManage && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedTimesheets.size === allTimesheetIds.length && allTimesheetIds.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {selectedTimesheets.size > 0
                ? `${selectedTimesheets.size} selected`
                : "Select all"}
            </span>
          </div>
          {selectedTimesheets.size > 0 && (
            <Button
              onClick={() => setIsPaymentDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Banknote className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
        <Mail className="h-4 w-4 inline mr-2" />
        For privacy, payment amounts are not displayed on screen. Use &quot;Email Report&quot; to send payment details directly to each locum.
      </div>

      {/* Locum Payment Cards */}
      <div className="space-y-3">
        {locumPayments.map((lp) => {
          const isExpanded = expandedLocums.has(lp.locum.id);
          const locumTimesheetIds = lp.timesheets.map(ts => ts.id);
          const selectedCount = locumTimesheetIds.filter(id => selectedTimesheets.has(id)).length;
          const allSelected = selectedCount === locumTimesheetIds.length;
          const isSendingThisEmail = sendingEmail === lp.locum.id;

          return (
            <div
              key={lp.locum.id}
              className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900"
            >
              {/* Locum Header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => toggleLocumExpand(lp.locum.id)}
              >
                {canManage && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => toggleLocumTimesheets(lp)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div className="flex-1 flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lp.locum.fullName}</span>
                      <Badge variant="outline" className="text-xs">
                        {lp.locum.sourceType === "AGENCY" ? (
                          <><Building2 className="h-3 w-3 mr-1" />{lp.locum.agencyName || "Agency"}</>
                        ) : (
                          <><User className="h-3 w-3 mr-1" />Direct</>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-500">
                      {lp.timesheets.length} timesheet{lp.timesheets.length === 1 ? "" : "s"} • {lp.totalHours.toFixed(1)}h total
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendPaymentReport(lp)}
                    disabled={isSendingThisEmail}
                  >
                    {isSendingThisEmail ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Email Report
                  </Button>
                </div>
              </div>

              {/* Expanded Timesheets - No monetary values shown */}
              {isExpanded && (
                <div className="border-t bg-slate-50 dark:bg-slate-800/30">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {canManage && <TableHead className="w-12"></TableHead>}
                        <TableHead>Date</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lp.timesheets.map((ts) => (
                        <TableRow key={ts.id}>
                          {canManage && (
                            <TableCell>
                              <Checkbox
                                checked={selectedTimesheets.has(ts.id)}
                                onCheckedChange={() => toggleTimesheetSelection(ts.id)}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {format(new Date(ts.date), "dd MMM yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-500" />
                              {ts.clockIn ? format(new Date(ts.clockIn), "HH:mm") : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-red-500" />
                              {ts.clockOut ? format(new Date(ts.clockOut), "HH:mm") : "-"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {ts.hoursWorked?.toFixed(1) || 0}h
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Mark {selectedTimesheets.size} timesheet{selectedTimesheets.size === 1 ? "" : "s"} as paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentRef">Payment Reference (Optional)</Label>
              <Input
                id="paymentRef"
                placeholder="e.g., EFT-20240115-001"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
              <p className="text-sm text-slate-500">
                Add a reference number for tracking (e.g., bank transfer reference)
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
              <strong>Reminder:</strong> Make sure you have sent payment reports to all locums before marking as paid.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
