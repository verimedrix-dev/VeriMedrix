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
import { FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { addEmployeeDocument } from "@/lib/actions/employees";
import { uploadDocumentFile } from "@/lib/actions/documents";

type EmployeeDocumentDialogProps = {
  employeeId: string;
  employeeName: string;
};

const DOCUMENT_TYPES = [
  { value: "CONTRACT", label: "Employment Contract" },
  { value: "ID_COPY", label: "ID Copy" },
  { value: "CV", label: "CV / Resume" },
  { value: "QUALIFICATION", label: "Qualification Certificate" },
  { value: "REGISTRATION", label: "Professional Registration" },
  { value: "POLICE_CLEARANCE", label: "Police Clearance" },
  { value: "MEDICAL_AID", label: "Medical Aid Details" },
  { value: "TAX_CERTIFICATE", label: "Tax Certificate" },
  { value: "BANK_DETAILS", label: "Bank Details" },
  { value: "JOB_DESCRIPTION", label: "Job Description" },
  { value: "CONFIDENTIALITY", label: "Confidentiality Agreement" },
  { value: "OTHER", label: "Other" },
];

export function EmployeeDocumentDialog({ employeeId, employeeName }: EmployeeDocumentDialogProps) {
  const { refresh } = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    documentType: "",
    expiryDate: "",
    notes: "",
  });

  // Get the label for the selected document type to use as title
  const getDocumentTypeLabel = (value: string) => {
    return DOCUMENT_TYPES.find(t => t.value === value)?.label || value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.documentType) {
      toast.error("Please select a document type");
      return;
    }

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setLoading(true);

    try {
      // Upload file to Supabase Storage
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      const uploadResult = await uploadDocumentFile(uploadFormData);

      await addEmployeeDocument({
        employeeId,
        documentType: formData.documentType,
        title: getDocumentTypeLabel(formData.documentType),
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        notes: formData.notes || undefined,
      });

      setOpen(false);
      setFormData({ documentType: "", expiryDate: "", notes: "" });
      setFile(null);
      refresh();
      toast.success("Document uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Employee Document</DialogTitle>
            <DialogDescription>
              Add a document for {employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, documentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeFile">File *</Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <input
                  type="file"
                  id="employeeFile"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="employeeFile" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
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
                      <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        PDF, DOC, DOCX, JPG, PNG up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this document..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
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
              Upload Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
