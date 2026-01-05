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
import { createAdverseEvent } from "@/lib/actions/adverse-events";
import { AdverseEventCategory, AdverseEventSeverity } from "@prisma/client";

const CATEGORY_LABELS: Record<AdverseEventCategory, string> = {
  MEDICATION_ERROR: "Medication Error",
  PROCEDURE_COMPLICATION: "Procedure Complication",
  DIAGNOSTIC_ERROR: "Diagnostic Error",
  EQUIPMENT_FAILURE: "Equipment Failure",
  FALL: "Patient Fall",
  INFECTION: "Healthcare-Associated Infection",
  ALLERGIC_REACTION: "Allergic Reaction",
  NEEDLE_STICK: "Needle Stick Injury",
  OTHER: "Other",
};

const SEVERITY_CONFIG: Record<AdverseEventSeverity, { label: string; description: string; color: string }> = {
  NEAR_MISS: {
    label: "Near Miss",
    description: "Event was caught before reaching the patient",
    color: "text-blue-600",
  },
  MINOR: {
    label: "Minor",
    description: "Minimal harm, no additional treatment needed",
    color: "text-yellow-600",
  },
  MODERATE: {
    label: "Moderate",
    description: "Required additional treatment or prolonged recovery",
    color: "text-orange-600",
  },
  SEVERE: {
    label: "Severe",
    description: "Significant harm, permanent damage, or death",
    color: "text-red-600",
  },
};

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventDate: "",
    patientInitials: "",
    patientFileNumber: "",
    category: "" as AdverseEventCategory | "",
    severity: "" as AdverseEventSeverity | "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventDate || !formData.category || !formData.severity || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await createAdverseEvent({
        eventDate: new Date(formData.eventDate),
        patientInitials: formData.patientInitials || undefined,
        patientFileNumber: formData.patientFileNumber || undefined,
        category: formData.category as AdverseEventCategory,
        severity: formData.severity as AdverseEventSeverity,
        description: formData.description,
      });

      toast.success("Adverse event recorded");
      setOpen(false);
      setFormData({
        eventDate: "",
        patientInitials: "",
        patientFileNumber: "",
        category: "",
        severity: "",
        description: "",
      });
    } catch (error) {
      toast.error("Failed to record event");
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
          Report Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report Adverse Event</DialogTitle>
            <DialogDescription>
              Record a patient safety incident or near miss for OHSC compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                max={today}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientInitials">Patient Initials</Label>
                <Input
                  id="patientInitials"
                  placeholder="e.g., JM"
                  maxLength={5}
                  value={formData.patientInitials}
                  onChange={(e) => setFormData({ ...formData, patientInitials: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientFileNumber">File Number</Label>
                <Input
                  id="patientFileNumber"
                  placeholder="Internal ref only"
                  value={formData.patientFileNumber}
                  onChange={(e) => setFormData({ ...formData, patientFileNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Event Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as AdverseEventCategory })}
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
                onValueChange={(value) => setFormData({ ...formData, severity: value as AdverseEventSeverity })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_CONFIG).map(([key, { label, description, color }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className={color}>{label}</span>
                        <span className="text-xs text-slate-500">{description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Event *</Label>
              <Textarea
                id="description"
                placeholder="Describe what happened, when, where, and who was involved..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Report Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
