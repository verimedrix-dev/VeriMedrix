"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2, Building } from "lucide-react";
import { toast } from "sonner";
import { approveTimesheet, rejectTimesheet, bulkApproveTimesheets } from "@/lib/actions/locums";
import { format } from "date-fns";
import { LocumSourceType } from "@prisma/client";

interface Timesheet {
  id: string;
  locumId: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  breakMinutes: number;
  hoursWorked: number | null;
  hourlyRate: number;
  totalPayable: number | null;
  notes: string | null;
  Locum: {
    id: string;
    fullName: string;
    sourceType: LocumSourceType;
    agencyName: string | null;
  };
}

interface TimesheetApprovalTableProps {
  timesheets: Timesheet[];
  canApprove: boolean;
}

export function TimesheetApprovalTable({ timesheets, canApprove }: TimesheetApprovalTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; timesheetId: string | null }>({
    open: false,
    timesheetId: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === timesheets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(timesheets.map((t) => t.id)));
    }
  };

  const handleApprove = async (timesheetId: string) => {
    setLoading(timesheetId);
    try {
      await approveTimesheet(timesheetId);
      toast.success("Timesheet approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.timesheetId || !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setLoading(rejectDialog.timesheetId);
    try {
      await rejectTimesheet(rejectDialog.timesheetId, rejectReason);
      toast.success("Timesheet rejected");
      setRejectDialog({ open: false, timesheetId: null });
      setRejectReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    } finally {
      setLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await bulkApproveTimesheets(Array.from(selected));
      toast.success(`${selected.size} timesheet${selected.size === 1 ? "" : "s"} approved`);
      setSelected(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <>
      {canApprove && selected.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {selected.size} timesheet{selected.size === 1 ? "" : "s"} selected
          </span>
          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkLoading}
          >
            {bulkLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Approve Selected
          </Button>
        </div>
      )}

      <div className="rounded-md border dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              {canApprove && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selected.size === timesheets.length && timesheets.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>Locum</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Total</TableHead>
              {canApprove && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheets.map((ts) => (
              <TableRow key={ts.id}>
                {canApprove && (
                  <TableCell>
                    <Checkbox
                      checked={selected.has(ts.id)}
                      onCheckedChange={() => toggleSelect(ts.id)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <p className="font-medium">{ts.Locum.fullName}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      {ts.Locum.sourceType === "AGENCY" ? (
                        <>
                          <Building className="h-3 w-3" />
                          {ts.Locum.agencyName || "Agency"}
                        </>
                      ) : (
                        "Direct"
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(ts.date), "dd MMM yyyy")}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>
                      {ts.clockIn ? format(new Date(ts.clockIn), "HH:mm") : "--"} -{" "}
                      {ts.clockOut ? format(new Date(ts.clockOut), "HH:mm") : "--"}
                    </p>
                    {ts.breakMinutes > 0 && (
                      <p className="text-xs text-slate-500">
                        {ts.breakMinutes}min break
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ts.hoursWorked?.toFixed(2) || 0}h
                  </Badge>
                </TableCell>
                <TableCell>R{ts.hourlyRate}</TableCell>
                <TableCell>
                  <span className="font-medium">
                    R{ts.totalPayable?.toFixed(2) || 0}
                  </span>
                </TableCell>
                {canApprove && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleApprove(ts.id)}
                        disabled={loading === ts.id}
                      >
                        {loading === ts.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setRejectDialog({ open: true, timesheetId: ts.id })}
                        disabled={loading === ts.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) => setRejectDialog({ open, timesheetId: open ? rejectDialog.timesheetId : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet. The locum will need to re-submit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for rejection *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Incorrect hours recorded, missing break time..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialog({ open: false, timesheetId: null });
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading === rejectDialog.timesheetId || !rejectReason.trim()}
              >
                {loading === rejectDialog.timesheetId && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Reject Timesheet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
