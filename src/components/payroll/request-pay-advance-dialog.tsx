"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Loader2 } from "lucide-react";
import { requestPayAdvance } from "@/lib/actions/pay-advance";
import { toast } from "sonner";

interface RequestPayAdvanceDialogProps {
  employeeId: string;
  employeeName: string;
  monthlySalary: number;
}

export function RequestPayAdvanceDialog({
  employeeId,
  employeeName,
  monthlySalary,
}: RequestPayAdvanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const maxAdvance = monthlySalary * 0.5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        toast.error("Please enter a valid amount");
        setLoading(false);
        return;
      }

      const result = await requestPayAdvance(employeeId, amountValue, reason);

      if (result.success) {
        toast.success("Pay advance request submitted successfully");
        setOpen(false);
        setAmount("");
        setReason("");
      } else {
        toast.error(result.error || "Failed to submit request");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4 mr-2" />
          Request Advance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Pay Advance</DialogTitle>
          <DialogDescription>
            Request an advance on your upcoming salary. Maximum allowed: R
            {maxAdvance.toFixed(2)} (50% of monthly salary)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Input id="employee" value={employeeName} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount Requested <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">R</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxAdvance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                Maximum: R{maxAdvance.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Emergency medical expenses, school fees, etc."
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Advances will be deducted from your next payslip</li>
                <li>Only one pending or approved advance allowed at a time</li>
                <li>Approval is at the discretion of management</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
