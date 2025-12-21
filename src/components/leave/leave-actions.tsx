"use client";

import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveLeaveRequest, declineLeaveRequest } from "@/lib/actions/employees";
import { useRefresh } from "@/hooks/use-refresh";

type LeaveActionsProps = {
  requestId: string;
  employeeName: string;
  leaveType: string;
  totalDays: number;
};

export function LeaveActions({
  requestId,
  employeeName,
  leaveType,
  totalDays,
}: LeaveActionsProps) {
  const { refresh, isPending } = useRefresh();
  const [approving, setApproving] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveLeaveRequest(requestId);
      refresh();
      toast.success(`Leave request approved for ${employeeName}`);
    } catch {
      toast.error("Failed to approve leave request");
    } finally {
      setApproving(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }

    setDeclining(true);
    try {
      await declineLeaveRequest(requestId, declineReason);
      setShowDeclineDialog(false);
      setDeclineReason("");
      refresh();
      toast.success(`Leave request declined for ${employeeName}`);
    } catch {
      toast.error("Failed to decline leave request");
    } finally {
      setDeclining(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowDeclineDialog(true)}
          disabled={approving}
        >
          <X className="h-4 w-4 mr-1" />
          Decline
        </Button>
        <Button size="sm" onClick={handleApprove} disabled={approving || isPending}>
          {(approving || isPending) ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Approve
        </Button>
      </div>

      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to decline {employeeName}&apos;s request for {totalDays} day(s) of{" "}
              {leaveType.replace(/_/g, " ").toLowerCase()}. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason for declining *</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Insufficient staff coverage during requested period"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDecline}
              disabled={declining || !declineReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {declining && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Decline Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
