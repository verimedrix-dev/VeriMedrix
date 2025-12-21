"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createLeaveRequest } from "@/lib/actions/employees";
import { differenceInBusinessDays, parseISO } from "date-fns";

type MyLeaveRequestDialogProps = {
  employeeId: string;
  leaveBalances: {
    annual: number;
    sick: number;
    family: number;
  };
};

export function MyLeaveRequestDialog({
  employeeId,
  leaveBalances,
}: MyLeaveRequestDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = parseISO(formData.startDate);
    const end = parseISO(formData.endDate);
    return Math.max(0, differenceInBusinessDays(end, start) + 1);
  };

  const totalDays = calculateDays();

  const getAvailableBalance = () => {
    switch (formData.leaveType) {
      case "ANNUAL":
        return leaveBalances.annual;
      case "SICK":
        return leaveBalances.sick;
      case "FAMILY_RESPONSIBILITY":
        return leaveBalances.family;
      default:
        return null;
    }
  };

  const availableBalance = getAvailableBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.leaveType || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (totalDays <= 0) {
      toast.error("End date must be after start date");
      return;
    }

    if (availableBalance !== null && totalDays > availableBalance) {
      toast.error(`Insufficient leave balance. Available: ${availableBalance} days`);
      return;
    }

    setLoading(true);

    try {
      await createLeaveRequest({
        employeeId,
        leaveType: formData.leaveType as "ANNUAL" | "SICK" | "FAMILY_RESPONSIBILITY" | "MATERNITY" | "STUDY" | "UNPAID",
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        totalDays,
        reason: formData.reason || undefined,
      });

      setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
      setOpen(false);

      // Use startTransition to ensure the UI updates immediately
      startTransition(() => {
        router.refresh();
      });

      toast.success("Leave request submitted successfully! Awaiting approval.");
    } catch {
      toast.error("Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a leave request for approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) =>
                  setFormData({ ...formData, leaveType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNUAL">
                    Annual Leave ({leaveBalances.annual} days available)
                  </SelectItem>
                  <SelectItem value="SICK">
                    Sick Leave ({leaveBalances.sick} days available)
                  </SelectItem>
                  <SelectItem value="FAMILY_RESPONSIBILITY">
                    Family Responsibility ({leaveBalances.family} days available)
                  </SelectItem>
                  <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                  <SelectItem value="STUDY">Study Leave</SelectItem>
                  <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Total business days:{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalDays} day{totalDays !== 1 ? "s" : ""}
                  </span>
                </p>
                {availableBalance !== null && (
                  <p
                    className={`text-xs mt-1 ${
                      totalDays > availableBalance
                        ? "text-red-600"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {totalDays > availableBalance
                      ? `Exceeds available balance by ${totalDays - availableBalance} day(s)`
                      : `${availableBalance - totalDays} day(s) will remain after this request`}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Reason for leave request..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isPending}>
              {(loading || isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
