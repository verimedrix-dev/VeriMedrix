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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setPositionRequirements } from "@/lib/actions/training";

interface TrainingModule {
  id: string;
  name: string;
  isRequired: boolean;
  cpdPoints: number | null;
}

interface PositionRequirementsDialogProps {
  position: string;
  modules: TrainingModule[];
  currentRequirements: string[]; // Module IDs currently assigned
}

export function PositionRequirementsDialog({
  position,
  modules,
  currentRequirements,
}: PositionRequirementsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>(currentRequirements);

  const handleToggle = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await setPositionRequirements(position, selectedModules);
      toast.success(`Training requirements updated for ${position}`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update requirements");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-1" />
          Configure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Training Requirements: {position}</DialogTitle>
          <DialogDescription>
            Select which trainings are required for this position.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto py-2">
          {modules.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No training modules defined yet. Create modules first.
            </p>
          ) : (
            modules.map((module) => (
              <div
                key={module.id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Checkbox
                  id={module.id}
                  checked={selectedModules.includes(module.id)}
                  onCheckedChange={() => handleToggle(module.id)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={module.id}
                    className="font-medium cursor-pointer"
                  >
                    {module.name}
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    {module.cpdPoints && (
                      <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded">
                        {module.cpdPoints} CPD points
                      </span>
                    )}
                    {module.isRequired && (
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-slate-500">
            {selectedModules.length} training{selectedModules.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Requirements
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
