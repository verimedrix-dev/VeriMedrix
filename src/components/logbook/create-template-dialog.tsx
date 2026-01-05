"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTaskTemplate, generateTasksFromTemplates } from "@/lib/actions/tasks";

const FREQUENCY_OPTIONS = [
  { value: "MULTIPLE_DAILY", label: "Multiple times daily", description: "E.g., bathroom checks every 2 hours" },
  { value: "DAILY", label: "Daily", description: "Once per day" },
  { value: "WEEKLY", label: "Weekly", description: "Once per week (Mondays)" },
  { value: "MONTHLY", label: "Monthly", description: "Once per month (1st)" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "Hygiene", label: "Hygiene & Cleaning" },
  { value: "Safety", label: "Safety Checks" },
  { value: "Equipment", label: "Equipment & Monitoring" },
  { value: "Inventory", label: "Inventory & Stock" },
  { value: "Compliance", label: "Compliance & Documentation" },
  { value: "Other", label: "Other" },
];

type Frequency = (typeof FREQUENCY_OPTIONS)[number]["value"];

export function CreateTemplateDialog() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "DAILY" as Frequency,
    category: "",
    requiresEvidence: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a task name");
      return;
    }

    setLoading(true);
    try {
      await createTaskTemplate({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        frequency: formData.frequency,
        category: formData.category || undefined,
        requiresEvidence: formData.requiresEvidence,
      });

      // Generate task for today if applicable
      await generateTasksFromTemplates();

      toast.success("Task template created!");
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        frequency: "DAILY",
        category: "",
        requiresEvidence: true,
      });
    } catch (error) {
      console.error("Create template error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <Button disabled>
        <Plus className="h-4 w-4 mr-2" />
        Add Template
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task Template</DialogTitle>
            <DialogDescription>
              Set up a recurring task that will automatically appear in your logbook
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Task Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Bathroom Cleaning Check"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What needs to be done..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: Frequency) =>
                  setFormData({ ...formData, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <span>{option.label}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <Label htmlFor="requiresEvidence" className="font-medium">
                  Require Photo Evidence
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Staff must upload a photo when completing this task
                </p>
              </div>
              <Switch
                id="requiresEvidence"
                checked={formData.requiresEvidence}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresEvidence: checked })
                }
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
