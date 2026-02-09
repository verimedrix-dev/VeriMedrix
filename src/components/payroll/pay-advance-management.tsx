"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, DollarSign, Clock, Ban, CheckCircle2 } from "lucide-react";
import { PayAdvanceWithDetails } from "@/lib/actions/pay-advance";
import { approvePayAdvance, rejectPayAdvance } from "@/lib/actions/pay-advance";
import { toast } from "sonner";
import { useRefresh } from "@/hooks/use-refresh";

interface PayAdvanceManagementProps {
  advances: PayAdvanceWithDetails[];
}

export function PayAdvanceManagement({ advances }: PayAdvanceManagementProps) {
  const { refresh } = useRefresh();
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<PayAdvanceWithDetails | null>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  const pendingAdvances = advances.filter((a) => a.status === "PENDING");
  const approvedAdvances = advances.filter((a) => a.status === "APPROVED");
  const completedAdvances = advances.filter((a) => a.status === "DEDUCTED" || a.status === "REJECTED");

  const handleApprove = async () => {
    if (!selectedAdvance) return;
    setLoading(true);

    try {
      const amount = approvedAmount ? parseFloat(approvedAmount) : undefined;
      const result = await approvePayAdvance(selectedAdvance.id, amount, notes);

      if (result.success) {
        toast.success("Pay advance approved successfully");
        setApproveDialogOpen(false);
        setApprovedAmount("");
        setNotes("");
        setSelectedAdvance(null);
        refresh();
      } else {
        toast.error(result.error || "Failed to approve advance");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAdvance || !rejectionReason) return;
    setLoading(true);

    try {
      const result = await rejectPayAdvance(selectedAdvance.id, rejectionReason);

      if (result.success) {
        toast.success("Pay advance rejected");
        setRejectDialogOpen(false);
        setRejectionReason("");
        setSelectedAdvance(null);
        refresh();
      } else {
        toast.error(result.error || "Failed to reject advance");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <Ban className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "DEDUCTED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Deducted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingAdvances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Requests ({pendingAdvances.length})
            </CardTitle>
            <CardDescription>Advance requests awaiting your review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAdvances.map((advance) => (
                <div
                  key={advance.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {advance.employeeName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Requested: R{advance.requestedAmount.toFixed(2)}
                    </p>
                    {advance.reason && (
                      <p className="text-xs text-slate-500 mt-1">
                        Reason: {advance.reason}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(advance.requestedAt).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAdvance(advance);
                        setApprovedAmount(advance.requestedAmount.toString());
                        setApproveDialogOpen(true);
                      }}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAdvance(advance);
                        setRejectDialogOpen(true);
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved Advances */}
      {approvedAdvances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Approved Advances ({approvedAdvances.length})
            </CardTitle>
            <CardDescription>Advances pending deduction from next payroll</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedAdvances.map((advance) => (
                <div
                  key={advance.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {advance.employeeName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Amount: R{(advance.approvedAmount || advance.requestedAmount).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Approved by {advance.reviewedByName} on{" "}
                      {advance.reviewedAt &&
                        new Date(advance.reviewedAt).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                  {getStatusBadge(advance.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {completedAdvances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Completed and rejected advance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedAdvances.slice(0, 10).map((advance) => (
                <div
                  key={advance.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {advance.employeeName}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      R{(advance.approvedAmount || advance.requestedAmount).toFixed(2)}
                    </p>
                    {advance.status === "REJECTED" && advance.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {advance.rejectionReason}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(advance.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Advances */}
      {advances.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500">No pay advance requests yet</p>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Pay Advance</DialogTitle>
            <DialogDescription>
              Review and approve the pay advance request
            </DialogDescription>
          </DialogHeader>
          {selectedAdvance && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <p className="text-sm font-medium">{selectedAdvance.employeeName}</p>
              </div>

              <div className="space-y-2">
                <Label>Requested Amount</Label>
                <p className="text-sm">R{selectedAdvance.requestedAmount.toFixed(2)}</p>
              </div>

              {selectedAdvance.reason && (
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <p className="text-sm text-slate-600">{selectedAdvance.reason}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="approvedAmount">Approved Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">R</span>
                  <Input
                    id="approvedAmount"
                    type="number"
                    step="0.01"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Leave as is to approve the requested amount
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes for your records"
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Pay Advance</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          {selectedAdvance && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <p className="text-sm font-medium">{selectedAdvance.employeeName}</p>
              </div>

              <div className="space-y-2">
                <Label>Requested Amount</Label>
                <p className="text-sm">R{selectedAdvance.requestedAmount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Insufficient funds, policy violation, etc."
                  rows={3}
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading || !rejectionReason}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
