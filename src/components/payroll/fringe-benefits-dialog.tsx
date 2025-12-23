"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Car, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getEmployeeFringeBenefits,
  addEmployeeFringeBenefit,
  removeEmployeeFringeBenefit,
} from "@/lib/actions/fringe-benefits";
import type { BenefitType } from "@prisma/client";

type FringeBenefit = {
  id: string;
  benefitType: BenefitType;
  description: string | null;
  monthlyTaxableValue: any; // Decimal from Prisma
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

type FringeBenefitsDialogProps = {
  employeeId: string;
  employeeName: string;
};

const BENEFIT_TYPES: { value: BenefitType; label: string }[] = [
  { value: "COMPANY_CAR", label: "Company Car" },
  { value: "HOUSING_ALLOWANCE", label: "Housing Allowance" },
  { value: "CELL_PHONE", label: "Cell Phone" },
  { value: "TRAVEL_ALLOWANCE", label: "Travel Allowance" },
  { value: "MEAL_ALLOWANCE", label: "Meal Allowance" },
  { value: "FUEL_CARD", label: "Fuel Card" },
  { value: "MEDICAL_AID_EMPLOYER_PORTION", label: "Medical Aid (Employer Portion)" },
  { value: "OTHER", label: "Other" },
];

export function FringeBenefitsDialog({ employeeId, employeeName }: FringeBenefitsDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [benefits, setBenefits] = useState<FringeBenefit[]>([]);
  const [loadingBenefits, setLoadingBenefits] = useState(true);

  // New benefit form
  const [newBenefit, setNewBenefit] = useState({
    benefitType: "" as BenefitType | "",
    description: "",
    monthlyTaxableValue: "",
    effectiveFrom: "",
  });

  useEffect(() => {
    if (open) {
      loadBenefits();
    }
  }, [open]);

  const loadBenefits = async () => {
    setLoadingBenefits(true);
    try {
      const data = await getEmployeeFringeBenefits(employeeId);
      setBenefits(data);
    } catch (error) {
      toast.error("Failed to load fringe benefits");
    } finally {
      setLoadingBenefits(false);
    }
  };

  const handleAddBenefit = async () => {
    if (!newBenefit.benefitType) {
      toast.error("Please select a benefit type");
      return;
    }

    if (!newBenefit.monthlyTaxableValue || parseFloat(newBenefit.monthlyTaxableValue) <= 0) {
      toast.error("Please enter a valid taxable value");
      return;
    }

    if (!newBenefit.effectiveFrom) {
      toast.error("Please select an effective from date");
      return;
    }

    setLoading(true);
    try {
      await addEmployeeFringeBenefit({
        employeeId,
        benefitType: newBenefit.benefitType,
        description: newBenefit.description || undefined,
        monthlyTaxableValue: parseFloat(newBenefit.monthlyTaxableValue),
        effectiveFrom: new Date(newBenefit.effectiveFrom),
      });
      setNewBenefit({ benefitType: "", description: "", monthlyTaxableValue: "", effectiveFrom: "" });
      await loadBenefits();
      refresh();
      toast.success("Fringe benefit added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add fringe benefit");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBenefit = async (benefitId: string) => {
    try {
      await removeEmployeeFringeBenefit(benefitId);
      await loadBenefits();
      refresh();
      toast.success("Fringe benefit removed");
    } catch {
      toast.error("Failed to remove fringe benefit");
    }
  };

  // Calculate total monthly fringe benefits
  const totalMonthly = benefits.reduce((sum, b) => {
    const now = new Date();
    const isActive = new Date(b.effectiveFrom) <= now && (!b.effectiveTo || new Date(b.effectiveTo) >= now);
    return isActive ? sum + Number(b.monthlyTaxableValue) : sum;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Car className="h-4 w-4 mr-1" />
          Fringe Benefits
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fringe Benefits</DialogTitle>
          <DialogDescription>
            Manage taxable fringe benefits for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Monthly Taxable Value</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  R {totalMonthly.toFixed(2)}
                </p>
              </div>
              <Badge variant="outline" className="border-blue-300 dark:border-blue-700">
                {benefits.length} {benefits.length === 1 ? "Benefit" : "Benefits"}
              </Badge>
            </div>
          </div>

          {/* Current Benefits */}
          <div className="space-y-2">
            <Label>Current Fringe Benefits</Label>
            {loadingBenefits ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : benefits.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No fringe benefits configured</p>
            ) : (
              <div className="space-y-2">
                {benefits.map((benefit) => {
                  const now = new Date();
                  const isActive = new Date(benefit.effectiveFrom) <= now && (!benefit.effectiveTo || new Date(benefit.effectiveTo) >= now);

                  return (
                    <div
                      key={benefit.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={isActive ? "default" : "outline"}>
                            {benefit.benefitType.replace(/_/g, " ")}
                          </Badge>
                          {!isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        {benefit.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {benefit.description}
                          </p>
                        )}
                        <p className="text-sm text-slate-500 mt-1">
                          R {Number(benefit.monthlyTaxableValue).toFixed(2)}/month • From {new Date(benefit.effectiveFrom).toLocaleDateString()}
                          {benefit.effectiveTo && ` to ${new Date(benefit.effectiveTo).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveBenefit(benefit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Benefit */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Add Fringe Benefit</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Benefit Type</Label>
                  <Select
                    value={newBenefit.benefitType}
                    onValueChange={(value: BenefitType) =>
                      setNewBenefit({ ...newBenefit, benefitType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BENEFIT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Monthly Taxable Value (R)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newBenefit.monthlyTaxableValue}
                    onChange={(e) => setNewBenefit({ ...newBenefit, monthlyTaxableValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Description (Optional)</Label>
                <Input
                  placeholder="e.g., Toyota Corolla, Company Apartment"
                  value={newBenefit.description}
                  onChange={(e) => setNewBenefit({ ...newBenefit, description: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Effective From</Label>
                <Input
                  type="date"
                  value={newBenefit.effectiveFrom}
                  onChange={(e) => setNewBenefit({ ...newBenefit, effectiveFrom: e.target.value })}
                />
              </div>

              <Button
                onClick={handleAddBenefit}
                disabled={loading || !newBenefit.benefitType}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Fringe Benefit
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> Fringe benefits are added to taxable income for PAYE calculation.
              The monthly taxable value should be determined according to SARS guidelines.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
