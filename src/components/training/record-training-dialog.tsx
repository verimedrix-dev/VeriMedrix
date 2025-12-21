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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createEmployeeTraining } from "@/lib/actions/training";

interface TrainingModule {
  id: string;
  name: string;
  provider: string | null;
  cpdPoints: number | null;
  validityMonths: number | null;
}

interface Employee {
  id: string;
  fullName: string;
  position: string;
}

interface RecordTrainingDialogProps {
  employees: Employee[];
  modules: TrainingModule[];
  defaultEmployeeId?: string;
}

export function RecordTrainingDialog({
  employees,
  modules,
  defaultEmployeeId,
}: RecordTrainingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [customTraining, setCustomTraining] = useState(false);

  const selectedModuleData = modules.find(m => m.id === selectedModule);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const employeeId = formData.get("employeeId") as string;
    const trainingName = customTraining
      ? (formData.get("trainingName") as string)
      : selectedModuleData?.name || "";
    const provider = formData.get("provider") as string;
    const completedDateStr = formData.get("completedDate") as string;
    const expiryDateStr = formData.get("expiryDate") as string;
    const status = formData.get("status") as string;
    const scoreStr = formData.get("score") as string;
    const cpdPointsStr = formData.get("cpdPoints") as string;
    const certificateNumber = formData.get("certificateNumber") as string;
    const notes = formData.get("notes") as string;

    try {
      await createEmployeeTraining({
        employeeId,
        trainingModuleId: customTraining ? undefined : selectedModule || undefined,
        trainingName,
        provider: provider || undefined,
        completedDate: new Date(completedDateStr),
        expiryDate: expiryDateStr ? new Date(expiryDateStr) : undefined,
        status: status as "COMPLETED" | "FAILED" | "IN_PROGRESS",
        score: scoreStr ? parseFloat(scoreStr) : undefined,
        cpdPoints: cpdPointsStr ? parseInt(cpdPointsStr) : undefined,
        certificateNumber: certificateNumber || undefined,
        notes: notes || undefined,
      });

      toast.success("Training record added!");
      setOpen(false);
      setSelectedModule("");
      setCustomTraining(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add training");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Award className="h-4 w-4 mr-2" />
          Record Training
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Employee Training</DialogTitle>
          <DialogDescription>
            Record a training completion or certification for an employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee *</Label>
            <Select name="employeeId" defaultValue={defaultEmployeeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} - {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Training Module</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomTraining(!customTraining)}
              >
                {customTraining ? "Select from modules" : "Enter custom"}
              </Button>
            </div>
            {customTraining ? (
              <Input
                name="trainingName"
                placeholder="Enter training name"
                required
              />
            ) : (
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select training module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name}
                      {module.cpdPoints && ` (${module.cpdPoints} CPD)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Training Provider</Label>
            <Input
              id="provider"
              name="provider"
              placeholder="e.g. Heart Foundation"
              defaultValue={selectedModuleData?.provider || ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completedDate">Completed Date *</Label>
              <Input
                id="completedDate"
                name="completedDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue="COMPLETED">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Passed/Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Score (%)</Label>
              <Input
                id="score"
                name="score"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 85"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpdPoints">CPD Points Earned</Label>
              <Input
                id="cpdPoints"
                name="cpdPoints"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={selectedModuleData?.cpdPoints?.toString() || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                name="certificateNumber"
                placeholder="e.g. CERT-12345"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes..."
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
            <Button type="submit" disabled={loading || (!customTraining && !selectedModule)}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Training
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
