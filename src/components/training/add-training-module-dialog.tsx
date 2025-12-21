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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BookPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTrainingModule } from "@/lib/actions/training";

export function AddTrainingModuleDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRequired, setIsRequired] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const provider = formData.get("provider") as string;
    const cpdPointsStr = formData.get("cpdPoints") as string;
    const validityMonthsStr = formData.get("validityMonths") as string;

    try {
      await createTrainingModule({
        name,
        description: description || undefined,
        provider: provider || undefined,
        cpdPoints: cpdPointsStr ? parseInt(cpdPointsStr) : undefined,
        validityMonths: validityMonthsStr ? parseInt(validityMonthsStr) : undefined,
        isRequired,
      });

      toast.success("Training module created!");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create training module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <BookPlus className="h-4 w-4 mr-2" />
          Add Training Module
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Training Module</DialogTitle>
          <DialogDescription>
            Define a training/certification that employees need to complete.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Training Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. BLS Certification, POPIA Compliance"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="What this training covers..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Training Provider</Label>
            <Input
              id="provider"
              name="provider"
              placeholder="e.g. Heart Foundation, Internal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpdPoints">CPD Points</Label>
              <Input
                id="cpdPoints"
                name="cpdPoints"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validityMonths">Valid for (months)</Label>
              <Input
                id="validityMonths"
                name="validityMonths"
                type="number"
                min="0"
                placeholder="e.g. 12, 24"
              />
              <p className="text-xs text-slate-500">Leave empty if no expiry</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <Label htmlFor="isRequired" className="font-medium">Required Training</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mark if this training is mandatory
              </p>
            </div>
            <Switch
              id="isRequired"
              checked={isRequired}
              onCheckedChange={setIsRequired}
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
              Create Module
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
