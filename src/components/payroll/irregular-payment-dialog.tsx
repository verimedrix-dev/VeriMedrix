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
import { Badge } from "@/components/ui/badge";
import { DollarSign, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addIrregularPayment, removeIrregularPayment } from "@/lib/actions/payroll";
import type { PaymentType } from "@prisma/client";

type PayrollAddition = {
  id: string;
  paymentType: PaymentType;
  name: string;
  amount: number;
};

type IrregularPaymentDialogProps = {
  entryId: string;
  employeeName: string;
  additions: PayrollAddition[];
};

const PAYMENT_TYPES: { value: PaymentType; label: string; description: string }[] = [
  { value: "BONUS", label: "Bonus", description: "Performance or annual bonus" },
  { value: "COMMISSION", label: "Commission", description: "Sales commission" },
  { value: "OVERTIME", label: "Overtime", description: "Overtime pay" },
  { value: "BACKPAY", label: "Back Pay", description: "Accumulated back payment" },
  { value: "SEVERANCE", label: "Severance", description: "Severance or retrenchment pay" },
  { value: "THIRTEENTH_CHEQUE", label: "13th Cheque", description: "Annual 13th cheque" },
  { value: "ALLOWANCE", label: "Allowance", description: "Other allowance payment" },
];

export function IrregularPaymentDialog({
  entryId,
  employeeName,
  additions,
}: IrregularPaymentDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Form state for adding new payment
  const [paymentType, setPaymentType] = useState<PaymentType>("BONUS");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const paymentName = name.trim() || PAYMENT_TYPES.find(t => t.value === paymentType)?.label || paymentType;

    setLoading(true);
    try {
      await addIrregularPayment({
        entryId,
        paymentType,
        name: paymentName,
        amount: parseFloat(amount),
      });
      refresh();
      // Reset form
      setName("");
      setAmount("");
      setPaymentType("BONUS");
      toast.success("Payment added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (additionId: string) => {
    setRemovingId(additionId);
    try {
      await removeIrregularPayment(additionId);
      refresh();
      toast.success("Payment removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove payment");
    } finally {
      setRemovingId(null);
    }
  };

  const selectedType = PAYMENT_TYPES.find((t) => t.value === paymentType);
  const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <DollarSign className="h-4 w-4 mr-1" />
          {additions.length === 0 ? "Add Bonus" : `Bonuses (${additions.length})`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Irregular Payments</DialogTitle>
          <DialogDescription>
            Add bonuses, overtime, commission, or other payments for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Current Additions List */}
          {additions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Payments</Label>
              <div className="border rounded-lg divide-y">
                {additions.map((addition) => (
                  <div
                    key={addition.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {PAYMENT_TYPES.find(t => t.value === addition.paymentType)?.label || addition.paymentType}
                      </Badge>
                      <span className="text-sm">{addition.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        R {addition.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemove(addition.id)}
                        disabled={removingId === addition.id}
                      >
                        {removingId === addition.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900">
                  <span className="font-medium text-sm">Total Additions</span>
                  <span className="font-bold text-green-600">
                    R {totalAdditions.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Add New Payment Form */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium">Add New Payment</Label>

            {/* Payment Type */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Type</Label>
              <Select
                value={paymentType}
                onValueChange={(value: PaymentType) => setPaymentType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-slate-500">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Name (optional) */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Description (optional)</Label>
              <Input
                placeholder={`e.g., "${selectedType?.label || 'Bonus'} - December"`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Add Button */}
            <Button
              onClick={handleAdd}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Payment
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> These amounts will be added to the regular salary and taxed using the annualisation method as required by SARS.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
