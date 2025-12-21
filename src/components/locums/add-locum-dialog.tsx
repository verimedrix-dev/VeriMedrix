"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createLocum } from "@/lib/actions/locums";
import { LocumSourceType } from "@prisma/client";

export function AddLocumDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<LocumSourceType>("DIRECT");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const idNumber = formData.get("idNumber") as string;
    const agencyName = formData.get("agencyName") as string;
    const hourlyRateStr = formData.get("hourlyRate") as string;
    const hpcsaNumber = formData.get("hpcsaNumber") as string;
    const hpcsaExpiryStr = formData.get("hpcsaExpiry") as string;
    const indemnityInsuranceNumber = formData.get("indemnityInsuranceNumber") as string;
    const indemnityInsuranceExpiryStr = formData.get("indemnityInsuranceExpiry") as string;
    const notes = formData.get("notes") as string;

    if (!hourlyRateStr || parseFloat(hourlyRateStr) <= 0) {
      toast.error("Please enter a valid hourly rate");
      setLoading(false);
      return;
    }

    try {
      await createLocum({
        fullName,
        sourceType,
        email: email || undefined,
        phone: phone || undefined,
        idNumber: idNumber || undefined,
        agencyName: sourceType === "AGENCY" ? agencyName || undefined : undefined,
        hourlyRate: parseFloat(hourlyRateStr),
        hpcsaNumber: hpcsaNumber || undefined,
        hpcsaExpiry: hpcsaExpiryStr ? new Date(hpcsaExpiryStr) : undefined,
        indemnityInsuranceNumber: indemnityInsuranceNumber || undefined,
        indemnityInsuranceExpiry: indemnityInsuranceExpiryStr ? new Date(indemnityInsuranceExpiryStr) : undefined,
        notes: notes || undefined,
      });

      toast.success("Locum added successfully!");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to add locum");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Locum
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Locum</DialogTitle>
          <DialogDescription>
            Register a locum. They will be able to clock in/out once added.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Dr. John Smith"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="doctor@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="082 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number</Label>
            <Input
              id="idNumber"
              name="idNumber"
              placeholder="9001015800089"
            />
          </div>

          {/* Source & Payment */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Source & Payment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourceType">Source *</Label>
                <Select
                  value={sourceType}
                  onValueChange={(v) => setSourceType(v as LocumSourceType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT">Direct Hire</SelectItem>
                    <SelectItem value="AGENCY">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (R) *</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500"
                  required
                />
              </div>
            </div>
            {sourceType === "AGENCY" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  name="agencyName"
                  placeholder="Locum Agency Name"
                />
              </div>
            )}
          </div>

          {/* Professional Registration */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Professional Registration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hpcsaNumber">HPCSA Number</Label>
                <Input
                  id="hpcsaNumber"
                  name="hpcsaNumber"
                  placeholder="MP0012345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hpcsaExpiry">HPCSA Expiry</Label>
                <Input
                  id="hpcsaExpiry"
                  name="hpcsaExpiry"
                  type="date"
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="indemnityInsuranceNumber">Indemnity Insurance #</Label>
              <Input
                id="indemnityInsuranceNumber"
                name="indemnityInsuranceNumber"
                placeholder="Policy number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="indemnityInsuranceExpiry">Insurance Expiry</Label>
              <Input
                id="indemnityInsuranceExpiry"
                name="indemnityInsuranceExpiry"
                type="date"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes about this locum..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Locum
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
