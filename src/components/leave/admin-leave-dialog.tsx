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
import { createAdminLeave } from "@/lib/actions/employees";
import { differenceInBusinessDays, parseISO } from "date-fns";

type Employee = {
  id: string;
  fullName: string;
  position: string | null;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  familyLeaveBalance: number;
};

type AdminLeaveDialogProps = {
  employees: Employee[];
};

export function AdminLeaveDialog({ employees }: AdminLeaveDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const selectedEmployee = employees.find((e) => e.id === formData.employeeId);

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = parseISO(formData.startDate);
    const end = parseISO(formData.endDate);
    return Math.max(0, differenceInBusinessDays(end, start) + 1);
  };

  const totalDays = calculateDays();

  const getAvailableBalance = () => {
    if (!selectedEmployee) return null;
    switch (formData.leaveType) {
      case "ANNUAL":
        return selectedEmployee.annualLeaveBalance;
      case "SICK":
        return selectedEmployee.sickLeaveBalance;
      case "FAMILY_RESPONSIBILITY":
        return selectedEmployee.familyLeaveBalance;
      default:
        return null;
    }
  };

  const availableBalance = getAvailableBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || !formData.leaveType || !formData.startDate || !formData.endDate) {
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
      await createAdminLeave({
        employeeId: formData.employeeId,
        leaveType: formData.leaveType as "ANNUAL" | "SICK" | "FAMILY_RESPONSIBILITY" | "MATERNITY" | "STUDY" | "UNPAID",
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        totalDays,
        reason: formData.reason || undefined,
      });

      setFormData({ employeeId: "", leaveType: "", startDate: "", endDate: "", reason: "" });
      setOpen(false);

      startTransition(() => {
        router.refresh();
      });

      toast.success("Leave recorded and approved successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create leave record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Add Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Leave</DialogTitle>
            <DialogDescription>
              Record leave on behalf of an employee. This will be automatically approved and deducted from their balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Employee Picker */}
            <div className="space-y-2">
              <Label htmlFor="employee">Employee *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, employeeId: value, leaveType: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName}{emp.position ? ` - ${emp.position}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leave Type */}
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
                    Annual Leave{selectedEmployee ? ` (${selectedEmployee.annualLeaveBalance} days available)` : ""}
                  </SelectItem>
                  <SelectItem value="SICK">
                    Sick Leave{selectedEmployee ? ` (${selectedEmployee.sickLeaveBalance} days available)` : ""}
                  </SelectItem>
                  <SelectItem value="FAMILY_RESPONSIBILITY">
                    Family Responsibility{selectedEmployee ? ` (${selectedEmployee.familyLeaveBalance} days available)` : ""}
                  </SelectItem>
                  <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                  <SelectItem value="STUDY">Study Leave</SelectItem>
                  <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
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

            {/* Days Summary */}
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
                      : `${availableBalance - totalDays} day(s) will remain after this`}
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Reason for leave..."
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
              Add Leave
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
