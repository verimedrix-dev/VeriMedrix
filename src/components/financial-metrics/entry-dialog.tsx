"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { saveFinancialMetrics } from "@/lib/actions/financial-metrics";
import {
  getCurrentPeriod,
  getLastPeriods,
  formatPeriod,
  FinancialMetricsData,
} from "@/lib/financial-metrics-utils";

interface EntryDialogProps {
  existingData?: FinancialMetricsData | null;
  onSaved?: () => void;
}

function formatRand(value: number): string {
  return `R${value.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function EntryDialog({ existingData, onSaved }: EntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(existingData?.period || getCurrentPeriod());

  // Form state
  const [formData, setFormData] = useState({
    totalRevenue: existingData?.totalRevenue?.toString() || "",
    totalConsults: existingData?.totalConsults?.toString() || "",
    revenuePerConsult: existingData?.revenuePerConsult?.toString() || "",
    billingErrorRate: existingData?.billingErrorRate?.toString() || "",
    profitAllocation: existingData?.profitAllocation?.toString() || "",
    ownerPayAllocation: existingData?.ownerPayAllocation?.toString() || "",
    taxReserveAllocation: existingData?.taxReserveAllocation?.toString() || "",
    payrollPercentage: existingData?.payrollPercentage?.toString() || "",
    consumablesPercentage: existingData?.consumablesPercentage?.toString() || "",
    rentPercentage: existingData?.rentPercentage?.toString() || "",
    overheadsPercentage: existingData?.overheadsPercentage?.toString() || "",
    medicalAidDSODays: existingData?.medicalAidDSODays?.toString() || "",
    cashCollectionDays: existingData?.cashCollectionDays?.toString() || "",
    notes: existingData?.notes || "",
  });

  const availablePeriods = getLastPeriods(12);

  // Calculate Rand amounts from percentages
  const revenue = parseFloat(formData.totalRevenue) || 0;

  const allocations = useMemo(() => {
    if (revenue <= 0) return null;
    const profit = (parseFloat(formData.profitAllocation) || 0) / 100 * revenue;
    const ownerPay = (parseFloat(formData.ownerPayAllocation) || 0) / 100 * revenue;
    const taxReserve = (parseFloat(formData.taxReserveAllocation) || 0) / 100 * revenue;
    const payroll = (parseFloat(formData.payrollPercentage) || 0) / 100 * revenue;
    const consumables = (parseFloat(formData.consumablesPercentage) || 0) / 100 * revenue;
    const rent = (parseFloat(formData.rentPercentage) || 0) / 100 * revenue;
    const overheads = (parseFloat(formData.overheadsPercentage) || 0) / 100 * revenue;

    const totalAllocated = profit + ownerPay + taxReserve + overheads;
    const remaining = revenue - totalAllocated;

    return { profit, ownerPay, taxReserve, payroll, consumables, rent, overheads, totalAllocated, remaining };
  }, [revenue, formData.profitAllocation, formData.ownerPayAllocation, formData.taxReserveAllocation, formData.payrollPercentage, formData.consumablesPercentage, formData.rentPercentage, formData.overheadsPercentage]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-calculate revenue per consult if both revenue and consults are entered
    if (field === "totalRevenue" || field === "totalConsults") {
      const rev = field === "totalRevenue" ? parseFloat(value) : parseFloat(formData.totalRevenue);
      const consults = field === "totalConsults" ? parseInt(value) : parseInt(formData.totalConsults);

      if (rev > 0 && consults > 0) {
        const rpc = rev / consults;
        setFormData((prev) => ({ ...prev, [field]: value, revenuePerConsult: rpc.toFixed(2) }));
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const parseNumber = (val: string): number | null => {
        if (!val || val.trim() === "") return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      const parseInt2 = (val: string): number | null => {
        if (!val || val.trim() === "") return null;
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
      };

      await saveFinancialMetrics({
        period,
        totalRevenue: parseNumber(formData.totalRevenue),
        totalConsults: parseInt2(formData.totalConsults),
        revenuePerConsult: parseNumber(formData.revenuePerConsult),
        billingErrorRate: parseNumber(formData.billingErrorRate),
        profitAllocation: parseNumber(formData.profitAllocation),
        ownerPayAllocation: parseNumber(formData.ownerPayAllocation),
        taxReserveAllocation: parseNumber(formData.taxReserveAllocation),
        payrollPercentage: parseNumber(formData.payrollPercentage),
        consumablesPercentage: parseNumber(formData.consumablesPercentage),
        rentPercentage: parseNumber(formData.rentPercentage),
        overheadsPercentage: parseNumber(formData.overheadsPercentage),
        medicalAidDSODays: parseInt2(formData.medicalAidDSODays),
        cashCollectionDays: parseInt2(formData.cashCollectionDays),
        notes: formData.notes || null,
      });

      toast.success(`Financial metrics saved for ${formatPeriod(period)}`);
      setOpen(false);
      onSaved?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save metrics");
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!existingData;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={isEditing ? "bg-slate-600 hover:bg-slate-700" : ""}>
          {isEditing ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit Data
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Enter Data
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Financial Metrics" : "Enter Financial Metrics"}
          </DialogTitle>
          <DialogDescription>
            Enter your practice&apos;s financial data. Rand amounts are calculated automatically from your revenue and percentages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Period Selection */}
          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={setPeriod} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {formatPeriod(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Revenue & Consults */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-900 dark:text-white">Revenue Data</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalRevenue">Total Revenue (R)</Label>
                <Input
                  id="totalRevenue"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 200000"
                  value={formData.totalRevenue}
                  onChange={(e) => handleChange("totalRevenue", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalConsults">Total Consults</Label>
                <Input
                  id="totalConsults"
                  type="number"
                  min="0"
                  placeholder="e.g., 500"
                  value={formData.totalConsults}
                  onChange={(e) => handleChange("totalConsults", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenuePerConsult">Revenue per Consult (R)</Label>
                <Input
                  id="revenuePerConsult"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Auto-calculated"
                  value={formData.revenuePerConsult}
                  onChange={(e) => handleChange("revenuePerConsult", e.target.value)}
                />
                <p className="text-xs text-slate-500">Auto-calculated from revenue / consults</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingErrorRate">Billing Error Rate (%)</Label>
                <Input
                  id="billingErrorRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: <2%"
                  value={formData.billingErrorRate}
                  onChange={(e) => handleChange("billingErrorRate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Profit First Allocations */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-900 dark:text-white">
              Profit First Allocations (%)
              {revenue > 0 && <span className="text-blue-600 dark:text-blue-400 ml-2 font-normal">from {formatRand(revenue)}</span>}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profitAllocation">Profit</Label>
                <Input
                  id="profitAllocation"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: 10%"
                  value={formData.profitAllocation}
                  onChange={(e) => handleChange("profitAllocation", e.target.value)}
                />
                {allocations && allocations.profit > 0 && (
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">= {formatRand(allocations.profit)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerPayAllocation">Owner&apos;s Pay</Label>
                <Input
                  id="ownerPayAllocation"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: 30%"
                  value={formData.ownerPayAllocation}
                  onChange={(e) => handleChange("ownerPayAllocation", e.target.value)}
                />
                {allocations && allocations.ownerPay > 0 && (
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">= {formatRand(allocations.ownerPay)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxReserveAllocation">Tax Reserve</Label>
                <Input
                  id="taxReserveAllocation"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: 20%"
                  value={formData.taxReserveAllocation}
                  onChange={(e) => handleChange("taxReserveAllocation", e.target.value)}
                />
                {allocations && allocations.taxReserve > 0 && (
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">= {formatRand(allocations.taxReserve)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Expense Ratios */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-900 dark:text-white">
              Expense Ratios (% of Revenue)
              {revenue > 0 && <span className="text-blue-600 dark:text-blue-400 ml-2 font-normal">from {formatRand(revenue)}</span>}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payrollPercentage">Payroll</Label>
                <Input
                  id="payrollPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: 30%"
                  value={formData.payrollPercentage}
                  onChange={(e) => handleChange("payrollPercentage", e.target.value)}
                />
                {allocations && allocations.payroll > 0 && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">= {formatRand(allocations.payroll)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumablesPercentage">Consumables</Label>
                <Input
                  id="consumablesPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: 10%"
                  value={formData.consumablesPercentage}
                  onChange={(e) => handleChange("consumablesPercentage", e.target.value)}
                />
                {allocations && allocations.consumables > 0 && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">= {formatRand(allocations.consumables)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentPercentage">Rent</Label>
                <Input
                  id="rentPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: 12%"
                  value={formData.rentPercentage}
                  onChange={(e) => handleChange("rentPercentage", e.target.value)}
                />
                {allocations && allocations.rent > 0 && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">= {formatRand(allocations.rent)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="overheadsPercentage">Total Overheads</Label>
                <Input
                  id="overheadsPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Target: ≤55%"
                  value={formData.overheadsPercentage}
                  onChange={(e) => handleChange("overheadsPercentage", e.target.value)}
                />
                {allocations && allocations.overheads > 0 && (
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">= {formatRand(allocations.overheads)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Live Budget Summary */}
          {allocations && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sm text-slate-900 dark:text-white">Budget Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Revenue</span>
                  <span className="font-medium">{formatRand(revenue)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                  <div className="flex justify-between text-green-700 dark:text-green-400">
                    <span>Profit ({formData.profitAllocation || 0}%)</span>
                    <span>{formatRand(allocations.profit)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 dark:text-green-400">
                    <span>Owner&apos;s Pay ({formData.ownerPayAllocation || 0}%)</span>
                    <span>{formatRand(allocations.ownerPay)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 dark:text-green-400">
                    <span>Tax Reserve ({formData.taxReserveAllocation || 0}%)</span>
                    <span>{formatRand(allocations.taxReserve)}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                  <div className="flex justify-between text-amber-700 dark:text-amber-400">
                    <span>Operating Expenses ({formData.overheadsPercentage || 0}%)</span>
                    <span>{formatRand(allocations.overheads)}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className={allocations.remaining >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}>
                      {allocations.remaining >= 0 ? "Unallocated" : "Over-allocated"}
                    </span>
                    <span className={allocations.remaining >= 0 ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}>
                      {formatRand(Math.abs(allocations.remaining))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Flow */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-900 dark:text-white">Cash Flow (Days)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medicalAidDSODays">Medical Aid DSO</Label>
                <Input
                  id="medicalAidDSODays"
                  type="number"
                  min="0"
                  placeholder="Target: ≤45 days"
                  value={formData.medicalAidDSODays}
                  onChange={(e) => handleChange("medicalAidDSODays", e.target.value)}
                />
                <p className="text-xs text-slate-500">Days Sales Outstanding</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashCollectionDays">Cash Collection Speed</Label>
                <Input
                  id="cashCollectionDays"
                  type="number"
                  min="0"
                  placeholder="Target: ≤7 days"
                  value={formData.cashCollectionDays}
                  onChange={(e) => handleChange("cashCollectionDays", e.target.value)}
                />
                <p className="text-xs text-slate-500">Average days to collect</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for this period..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Metrics
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
