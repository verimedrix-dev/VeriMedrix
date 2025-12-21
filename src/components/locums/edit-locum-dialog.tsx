"use client";

import { useState, ReactNode } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { updateLocum } from "@/lib/actions/locums";
import { toast } from "sonner";
import { format } from "date-fns";

type Locum = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  idNumber: string | null;
  hpcsaNumber: string | null;
  hpcsaExpiry: Date | null;
  sourceType: "DIRECT" | "AGENCY";
  agencyName: string | null;
  hourlyRate: number;
  indemnityInsuranceNumber: string | null;
  indemnityInsuranceExpiry: Date | null;
  isActive: boolean;
  notes: string | null;
};

interface EditLocumDialogProps {
  locum: Locum;
  children: ReactNode;
}

export function EditLocumDialog({ locum, children }: EditLocumDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: locum.fullName,
    email: locum.email || "",
    phone: locum.phone || "",
    idNumber: locum.idNumber || "",
    hpcsaNumber: locum.hpcsaNumber || "",
    hpcsaExpiry: locum.hpcsaExpiry ? format(new Date(locum.hpcsaExpiry), "yyyy-MM-dd") : "",
    sourceType: locum.sourceType,
    agencyName: locum.agencyName || "",
    hourlyRate: locum.hourlyRate.toString(),
    indemnityInsuranceNumber: locum.indemnityInsuranceNumber || "",
    indemnityInsuranceExpiry: locum.indemnityInsuranceExpiry
      ? format(new Date(locum.indemnityInsuranceExpiry), "yyyy-MM-dd")
      : "",
    isActive: locum.isActive,
    notes: locum.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      toast.error("Valid hourly rate is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateLocum(locum.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        idNumber: formData.idNumber.trim() || undefined,
        hpcsaNumber: formData.hpcsaNumber.trim() || undefined,
        hpcsaExpiry: formData.hpcsaExpiry ? new Date(formData.hpcsaExpiry) : undefined,
        sourceType: formData.sourceType as "DIRECT" | "AGENCY",
        agencyName: formData.sourceType === "AGENCY" ? formData.agencyName.trim() : undefined,
        hourlyRate: parseFloat(formData.hourlyRate),
        indemnityInsuranceNumber: formData.indemnityInsuranceNumber.trim() || undefined,
        indemnityInsuranceExpiry: formData.indemnityInsuranceExpiry
          ? new Date(formData.indemnityInsuranceExpiry)
          : undefined,
        isActive: formData.isActive,
        notes: formData.notes.trim() || undefined,
      });

      if (result.success) {
        setOpen(false);
        refresh();
        toast.success("Locum updated successfully");
      } else {
        toast.error(result.error || "Failed to update locum");
      }
    } catch {
      toast.error("Failed to update locum");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Locum</DialogTitle>
          <DialogDescription>
            Update information for {locum.fullName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Dr. John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="082 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="8501015800083"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (R) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="450.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <Select
                value={formData.sourceType}
                onValueChange={(value) => setFormData({ ...formData, sourceType: value as "DIRECT" | "AGENCY" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="AGENCY">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.sourceType === "AGENCY" && (
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                  placeholder="MedStaff Agency"
                />
              </div>
            )}

            <div className="col-span-2 border-t pt-4 mt-2">
              <h4 className="font-medium mb-3">Professional Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hpcsaNumber">HPCSA Number</Label>
                  <Input
                    id="hpcsaNumber"
                    value={formData.hpcsaNumber}
                    onChange={(e) => setFormData({ ...formData, hpcsaNumber: e.target.value })}
                    placeholder="MP0012345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hpcsaExpiry">HPCSA Expiry</Label>
                  <Input
                    id="hpcsaExpiry"
                    type="date"
                    value={formData.hpcsaExpiry}
                    onChange={(e) => setFormData({ ...formData, hpcsaExpiry: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indemnityInsuranceNumber">Indemnity Insurance #</Label>
                  <Input
                    id="indemnityInsuranceNumber"
                    value={formData.indemnityInsuranceNumber}
                    onChange={(e) => setFormData({ ...formData, indemnityInsuranceNumber: e.target.value })}
                    placeholder="IND-12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indemnityInsuranceExpiry">Insurance Expiry</Label>
                  <Input
                    id="indemnityInsuranceExpiry"
                    type="date"
                    value={formData.indemnityInsuranceExpiry}
                    onChange={(e) => setFormData({ ...formData, indemnityInsuranceExpiry: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes about this locum..."
                rows={3}
              />
            </div>

            <div className="col-span-2 flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isActive" className="font-medium">Active Status</Label>
                <p className="text-sm text-slate-500">
                  Inactive locums cannot clock in or be scheduled
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
