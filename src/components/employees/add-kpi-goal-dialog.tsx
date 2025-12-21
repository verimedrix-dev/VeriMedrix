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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addKpiGoal } from "@/lib/actions/employees";

type AddKpiGoalDialogProps = {
  reviewId: string;
  quarter: number;
  year: number;
};

export function AddKpiGoalDialog({ reviewId, quarter, year }: AddKpiGoalDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a goal title");
      return;
    }

    setLoading(true);

    try {
      await addKpiGoal({
        reviewId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
      });

      setOpen(false);
      setFormData({ title: "", description: "" });
      refresh();
      toast.success("Goal added successfully!");
    } catch {
      toast.error("Failed to add goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Performance Goal</DialogTitle>
            <DialogDescription>
              Add a new goal for Q{quarter} {year} review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goalTitle">Goal Title *</Label>
              <Input
                id="goalTitle"
                placeholder="e.g., Improve patient satisfaction scores"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalDescription">Description (optional)</Label>
              <Textarea
                id="goalDescription"
                placeholder="Provide more details about this goal and how it will be measured..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">
                <strong>Tip:</strong> Goals should be specific, measurable, and achievable
                within the quarter. You can mark goals as met or not met during the review.
              </p>
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
              Add Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
