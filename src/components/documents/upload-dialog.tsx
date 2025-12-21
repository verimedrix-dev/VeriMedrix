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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { createDocument, getDocumentTypes, uploadDocumentFile } from "@/lib/actions/documents";

type DocumentType = {
  id: string;
  name: string;
  DocumentCategory: { id: string; name: string } | null;
};

export function UploadDocumentDialog() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [formData, setFormData] = useState({
    documentTypeId: "",
    expiryDate: "",
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);

  // Prevent hydration mismatch by only rendering Dialog on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      getDocumentTypes().then(setDocumentTypes);
    }
  }, [open]);

  // Get the name of the selected document type to use as title
  const getSelectedTypeName = () => {
    const selectedType = documentTypes.find(t => t.id === formData.documentTypeId);
    return selectedType?.name || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentTypeId) {
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

      await createDocument({
        documentTypeId: formData.documentTypeId,
        title: getSelectedTypeName(), // Use document type name as title
        fileUrl: uploadResult.url,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
        notes: formData.notes,
      });

      toast.success("Document uploaded successfully!");
      setOpen(false);
      setFormData({ documentTypeId: "", expiryDate: "", notes: "" });
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  // Group document types by category
  const groupedTypes = documentTypes.reduce((acc, type) => {
    const categoryName = type.DocumentCategory?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(type);
    return acc;
  }, {} as Record<string, DocumentType[]>);

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button disabled>
        <Upload className="h-4 w-4 mr-2" />
        Upload Document
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload OHSC Document</DialogTitle>
            <DialogDescription>
              Add a new OHSC compliance document to your practice cabinet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={formData.documentTypeId}
                onValueChange={(value) => setFormData({ ...formData, documentTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {Object.entries(groupedTypes).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
                        {category}
                      </div>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="file" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
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
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this document..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
