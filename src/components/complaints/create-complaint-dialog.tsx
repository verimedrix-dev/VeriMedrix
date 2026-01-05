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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createComplaint } from "@/lib/actions/complaints";
import { ComplaintCategory, Severity } from "@prisma/client";

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  SERVICE: "Quality of Service",
  STAFF: "Staff Conduct",
  BILLING: "Billing / Fees",
  FACILITIES: "Facilities / Environment",
  WAITING_TIME: "Waiting Time",
  OTHER: "Other",
};

const SEVERITY_LABELS: Record<Severity, { label: string; color: string }> = {
  LOW: { label: "Low", color: "text-green-600" },
  MEDIUM: { label: "Medium", color: "text-yellow-600" },
  HIGH: { label: "High", color: "text-red-600" },
};

export function CreateComplaintDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dateReceived: "",
    complainantName: "",
    complainantContact: "",
    category: "" as ComplaintCategory | "",
    severity: "MEDIUM" as Severity,
    summary: "",
    details: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dateReceived || !formData.category || !formData.summary) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await createComplaint({
        dateReceived: new Date(formData.dateReceived),
        complainantName: formData.complainantName || undefined,
        complainantContact: formData.complainantContact || undefined,
        category: formData.category as ComplaintCategory,
        severity: formData.severity,
        summary: formData.summary,
        details: formData.details || undefined,
      });

      toast.success("Complaint logged successfully");
      setOpen(false);
      setFormData({
        dateReceived: "",
        complainantName: "",
        complainantContact: "",
        category: "",
        severity: "MEDIUM",
        summary: "",
        details: "",
      });
    } catch (error) {
      toast.error("Failed to log complaint");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Log Complaint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log New Complaint</DialogTitle>
            <DialogDescription>
              Record a patient or visitor complaint. OHSC requires acknowledgement within 5 working days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="dateReceived">Date Received *</Label>
              <Input
                id="dateReceived"
                type="date"
                value={formData.dateReceived}
                onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
                max={today}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complainantName">Complainant Name</Label>
                <Input
                  id="complainantName"
                  placeholder="Can be anonymous"
                  value={formData.complainantName}
                  onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complainantContact">Contact (Phone/Email)</Label>
                <Input
                  id="complainantContact"
                  placeholder="For follow-up"
                  value={formData.complainantContact}
                  onChange={(e) => setFormData({ ...formData, complainantContact: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as ComplaintCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value as Severity })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEVERITY_LABELS).map(([key, { label, color }]) => (
                      <SelectItem key={key} value={key}>
                        <span className={color}>{label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Brief Summary *</Label>
              <Input
                id="summary"
                placeholder="One-line description of the complaint"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Full Details (optional)</Label>
              <Textarea
                id="details"
                placeholder="Provide additional context or details..."
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Complaint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
