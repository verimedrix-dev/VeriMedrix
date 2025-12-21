"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateEmployeeCompensation,
  addEmployeeDeduction,
  updateEmployeeDeduction,
  removeEmployeeDeduction,
} from "@/lib/actions/payroll";
import type { PayFrequency, UifExemptReason, DeductionType } from "@prisma/client";

type EmployeeWithDeductions = {
  id: string;
  fullName: string;
  grossSalary: number | null;
  payFrequency: PayFrequency | null;
  payDay: number | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankBranchCode: string | null;
  uifExempt: boolean;
  uifExemptReason: UifExemptReason | null;
  EmployeeDeduction: Array<{
    id: string;
    deductionType: DeductionType;
    name: string | null;
    amount: number | null;
    percentage: number | null;
    isActive: boolean;
  }>;
};

type CompensationDialogProps = {
  employee: EmployeeWithDeductions;
};

const PAY_FREQUENCIES: { value: PayFrequency; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "WEEKLY", label: "Weekly" },
];

const UIF_EXEMPT_REASONS: { value: UifExemptReason; label: string }[] = [
  { value: "WORKS_LESS_THAN_24_HOURS", label: "Works less than 24 hours/week" },
  { value: "INDEPENDENT_CONTRACTOR", label: "Independent contractor" },
  { value: "LEARNER_UNDER_AGREEMENT", label: "Learner under agreement" },
  { value: "PUBLIC_SERVANT", label: "Public servant" },
  { value: "FOREIGN_GOVERNMENT_EMPLOYEE", label: "Foreign government employee" },
  { value: "OTHER", label: "Other" },
];

const DEDUCTION_TYPES: { value: DeductionType; label: string }[] = [
  { value: "PAYE", label: "PAYE (Tax)" },
  { value: "PENSION", label: "Pension" },
  { value: "MEDICAL_AID", label: "Medical Aid" },
  { value: "CUSTOM", label: "Custom Deduction" },
];

export function CompensationDialog({ employee }: CompensationDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingDeduction, setAddingDeduction] = useState(false);

  // Compensation form data
  const [compData, setCompData] = useState({
    grossSalary: employee.grossSalary?.toString() || "",
    payFrequency: employee.payFrequency || "",
    payDay: employee.payDay?.toString() || "",
    bankName: employee.bankName || "",
    bankAccountNumber: employee.bankAccountNumber || "",
    bankBranchCode: employee.bankBranchCode || "",
    uifExempt: employee.uifExempt,
    uifExemptReason: employee.uifExemptReason || "",
  });

  // New deduction form
  const [newDeduction, setNewDeduction] = useState({
    deductionType: "" as DeductionType | "",
    name: "",
    amount: "",
    percentage: "",
  });

  const handleSaveCompensation = async () => {
    setLoading(true);
    try {
      await updateEmployeeCompensation(employee.id, {
        grossSalary: compData.grossSalary ? parseFloat(compData.grossSalary) : undefined,
        payFrequency: compData.payFrequency as PayFrequency || undefined,
        payDay: compData.payDay ? parseInt(compData.payDay) : undefined,
        bankName: compData.bankName || undefined,
        bankAccountNumber: compData.bankAccountNumber || undefined,
        bankBranchCode: compData.bankBranchCode || undefined,
        uifExempt: compData.uifExempt,
        uifExemptReason: compData.uifExempt
          ? (compData.uifExemptReason as UifExemptReason) || undefined
          : null,
      });
      refresh();
      toast.success("Compensation updated successfully");
    } catch {
      toast.error("Failed to update compensation");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeduction = async () => {
    if (!newDeduction.deductionType) {
      toast.error("Please select a deduction type");
      return;
    }

    if (newDeduction.deductionType === "CUSTOM" && !newDeduction.name) {
      toast.error("Please enter a name for the custom deduction");
      return;
    }

    setAddingDeduction(true);
    try {
      await addEmployeeDeduction({
        employeeId: employee.id,
        deductionType: newDeduction.deductionType,
        name: newDeduction.name || undefined,
        amount: newDeduction.amount ? parseFloat(newDeduction.amount) : undefined,
        percentage: newDeduction.percentage ? parseFloat(newDeduction.percentage) : undefined,
      });
      setNewDeduction({ deductionType: "", name: "", amount: "", percentage: "" });
      refresh();
      toast.success("Deduction added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add deduction");
    } finally {
      setAddingDeduction(false);
    }
  };

  const handleUpdateDeduction = async (deductionId: string, amount: number) => {
    try {
      await updateEmployeeDeduction(deductionId, { amount });
      refresh();
      toast.success("Deduction updated");
    } catch {
      toast.error("Failed to update deduction");
    }
  };

  const handleRemoveDeduction = async (deductionId: string) => {
    try {
      await removeEmployeeDeduction(deductionId);
      refresh();
      toast.success("Deduction removed");
    } catch {
      toast.error("Failed to remove deduction");
    }
  };

  // Calculate UIF preview
  const grossSalary = parseFloat(compData.grossSalary) || 0;
  const uifAmount = compData.uifExempt ? 0 : Math.min(grossSalary * 0.01, 177.12);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compensation Settings</DialogTitle>
          <DialogDescription>
            Manage salary and deductions for {employee.fullName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="salary" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
            <TabsTrigger value="deductions">Deductions</TabsTrigger>
          </TabsList>

          {/* Salary Tab */}
          <TabsContent value="salary" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grossSalary">Gross Salary (Monthly)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R</span>
                  <Input
                    id="grossSalary"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={compData.grossSalary}
                    onChange={(e) => setCompData({ ...compData, grossSalary: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payFrequency">Pay Frequency</Label>
                <Select
                  value={compData.payFrequency}
                  onValueChange={(value) => setCompData({ ...compData, payFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAY_FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payDay">
                Pay Day{" "}
                <span className="text-slate-400 text-sm">
                  ({compData.payFrequency === "WEEKLY" ? "1-7 (Mon-Sun)" : "1-31"})
                </span>
              </Label>
              <Input
                id="payDay"
                type="number"
                min="1"
                max={compData.payFrequency === "WEEKLY" ? "7" : "31"}
                placeholder={compData.payFrequency === "WEEKLY" ? "e.g., 5 (Friday)" : "e.g., 25"}
                value={compData.payDay}
                onChange={(e) => setCompData({ ...compData, payDay: e.target.value })}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uifExempt"
                  checked={compData.uifExempt}
                  onCheckedChange={(checked) =>
                    setCompData({ ...compData, uifExempt: checked as boolean })
                  }
                />
                <Label htmlFor="uifExempt" className="text-sm">
                  Exempt from UIF
                </Label>
              </div>

              {compData.uifExempt && (
                <div className="mt-3 space-y-2">
                  <Label>Exemption Reason</Label>
                  <Select
                    value={compData.uifExemptReason}
                    onValueChange={(value) =>
                      setCompData({ ...compData, uifExemptReason: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {UIF_EXEMPT_REASONS.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!compData.uifExempt && grossSalary > 0 && (
                <p className="mt-3 text-sm text-slate-500">
                  UIF contribution: <strong>R {uifAmount.toFixed(2)}</strong> (1% of gross, capped at R177.12)
                </p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={handleSaveCompensation} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Salary Settings
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Banking Tab */}
          <TabsContent value="banking" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g., FNB, Standard Bank, Nedbank"
                value={compData.bankName}
                onChange={(e) => setCompData({ ...compData, bankName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                placeholder="Account number"
                value={compData.bankAccountNumber}
                onChange={(e) => setCompData({ ...compData, bankAccountNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankBranchCode">Branch Code</Label>
              <Input
                id="bankBranchCode"
                placeholder="e.g., 250655"
                value={compData.bankBranchCode}
                onChange={(e) => setCompData({ ...compData, bankBranchCode: e.target.value })}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={handleSaveCompensation} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Banking Details
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Deductions Tab */}
          <TabsContent value="deductions" className="space-y-4 mt-4">
            {/* Existing Deductions */}
            <div className="space-y-2">
              <Label>Current Deductions</Label>
              {employee.EmployeeDeduction.filter((d) => d.isActive).length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No deductions configured</p>
              ) : (
                <div className="space-y-2">
                  {employee.EmployeeDeduction.filter((d) => d.isActive).map((deduction) => (
                    <div
                      key={deduction.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {deduction.deductionType === "CUSTOM"
                            ? deduction.name
                            : deduction.deductionType.replace(/_/g, " ")}
                        </Badge>
                        {deduction.deductionType === "UIF" ? (
                          <span className="text-sm text-slate-500">(Auto-calculated)</span>
                        ) : deduction.percentage ? (
                          <span className="text-sm">{deduction.percentage}% of gross</span>
                        ) : (
                          <span className="text-sm">R {deduction.amount?.toFixed(2) || "0.00"}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {deduction.deductionType !== "UIF" && (
                          <Input
                            type="number"
                            step="0.01"
                            className="w-24"
                            defaultValue={deduction.amount?.toString() || ""}
                            onBlur={(e) => {
                              const newAmount = parseFloat(e.target.value);
                              if (!isNaN(newAmount) && newAmount !== deduction.amount) {
                                handleUpdateDeduction(deduction.id, newAmount);
                              }
                            }}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleRemoveDeduction(deduction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Deduction */}
            <div className="border-t pt-4 mt-4">
              <Label>Add Deduction</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Select
                  value={newDeduction.deductionType}
                  onValueChange={(value: DeductionType) =>
                    setNewDeduction({ ...newDeduction, deductionType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEDUCTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {newDeduction.deductionType === "CUSTOM" && (
                  <Input
                    placeholder="Deduction name"
                    value={newDeduction.name}
                    onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Amount (R)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Fixed amount"
                    value={newDeduction.amount}
                    onChange={(e) => setNewDeduction({ ...newDeduction, amount: e.target.value })}
                  />
                </div>
                {newDeduction.deductionType === "PENSION" && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">OR Percentage (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="% of gross"
                      value={newDeduction.percentage}
                      onChange={(e) =>
                        setNewDeduction({ ...newDeduction, percentage: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <Button
                className="mt-3"
                onClick={handleAddDeduction}
                disabled={addingDeduction || !newDeduction.deductionType}
              >
                {addingDeduction ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Deduction
              </Button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mt-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> PAYE amounts are entered manually (not auto-calculated).
                UIF is automatically calculated at 1% of gross salary, capped at R177.12.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
