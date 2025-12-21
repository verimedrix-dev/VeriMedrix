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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { createWarning } from "@/lib/actions/employees";
import { uploadDocumentFile } from "@/lib/actions/documents";

type WarningDialogProps = {
  employeeId: string;
  employeeName: string;
};

export function WarningDialog({ employeeId, employeeName }: WarningDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    warningType: "",
    category: "",
    incidentDate: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.warningType || !formData.category || !formData.incidentDate || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      let documentUrl: string | undefined;

      // Upload file if provided
      if (file) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        const uploadResult = await uploadDocumentFile(uploadFormData);
        documentUrl = uploadResult.url;
      }

      await createWarning({
        employeeId,
        warningType: formData.warningType as "VERBAL" | "WRITTEN" | "FINAL_WRITTEN",
        category: formData.category as "LATE_ARRIVAL" | "ABSENTEEISM" | "MISCONDUCT" | "NEGLIGENCE" | "INSUBORDINATION" | "POLICY_VIOLATION" | "PERFORMANCE" | "OTHER",
        incidentDate: new Date(formData.incidentDate),
        description: formData.description,
        documentUrl,
      });

      setOpen(false);
      setFormData({ warningType: "", category: "", incidentDate: "", description: "" });
      setFile(null);
      refresh();
      toast.success("Warning issued successfully!");
    } catch {
      toast.error("Failed to issue warning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Issue Warning
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Issue Warning</DialogTitle>
            <DialogDescription>
              Create a disciplinary warning for {employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="warningType">Warning Type *</Label>
              <Select
                value={formData.warningType}
                onValueChange={(value) =>
                  setFormData({ ...formData, warningType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warning type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VERBAL">Verbal Warning</SelectItem>
                  <SelectItem value="WRITTEN">Written Warning</SelectItem>
                  <SelectItem value="FINAL_WRITTEN">Final Written Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
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
                  <SelectItem value="LATE_ARRIVAL">Late Arrival</SelectItem>
                  <SelectItem value="ABSENTEEISM">Absenteeism</SelectItem>
                  <SelectItem value="MISCONDUCT">Misconduct</SelectItem>
                  <SelectItem value="NEGLIGENCE">Negligence</SelectItem>
                  <SelectItem value="INSUBORDINATION">Insubordination</SelectItem>
                  <SelectItem value="POLICY_VIOLATION">Policy Violation</SelectItem>
                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incidentDate">Incident Date *</Label>
              <Input
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(e) =>
                  setFormData({ ...formData, incidentDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the incident and warning details..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warningFile">Supporting Document (optional)</Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <input
                  type="file"
                  id="warningFile"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="warningFile" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-6 w-6 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        className="ml-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                        }}
                      >
                        <X className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto text-slate-400 mb-1" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">Click to upload warning document</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, DOC, DOCX, JPG, PNG</p>
                    </>
                  )}
                </label>
              </div>
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
            <Button type="submit" disabled={loading} variant="destructive">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Issue Warning
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
