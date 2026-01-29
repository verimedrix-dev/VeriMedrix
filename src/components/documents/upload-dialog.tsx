"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { Upload, Loader2, FileText, Search, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { createDocument, getDocumentTypes, uploadDocumentFile } from "@/lib/actions/documents";
import { cn } from "@/lib/utils";

type DocumentType = {
  id: string;
  name: string;
  DocumentCategory: { id: string; name: string } | null;
};

type ValidationErrors = {
  documentType?: string;
  file?: string;
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
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [typeSearch, setTypeSearch] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      getDocumentTypes().then(setDocumentTypes);
    }
  }, [open]);

  // Focus search input when type picker opens
  useEffect(() => {
    if (typePickerOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [typePickerOpen]);

  const getSelectedTypeName = () => {
    const selectedType = documentTypes.find(t => t.id === formData.documentTypeId);
    return selectedType?.name || "";
  };

  // Group and filter document types by search
  const filteredGroupedTypes = useMemo(() => {
    const q = typeSearch.toLowerCase();

    const filtered = q
      ? documentTypes.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.DocumentCategory?.name || "").toLowerCase().includes(q)
        )
      : documentTypes;

    return filtered.reduce((acc, type) => {
      const categoryName = type.DocumentCategory?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(type);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [documentTypes, typeSearch]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.documentTypeId) {
      newErrors.documentType = "Please select a document type";
    }

    if (!file) {
      newErrors.file = "Please select a file to upload";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const uploadResult = await uploadDocumentFile(uploadFormData);

      await createDocument({
        documentTypeId: formData.documentTypeId,
        title: getSelectedTypeName(),
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
      setErrors({});
      setTypeSearch("");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (typeId: string) => {
    setFormData({ ...formData, documentTypeId: typeId });
    if (errors.documentType) setErrors({ ...errors, documentType: undefined });
    setTypePickerOpen(false);
    setTypeSearch("");
  };

  if (!mounted) {
    return (
      <Button disabled>
        <Upload className="h-4 w-4 mr-2" />
        Upload Document
      </Button>
    );
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData({ documentTypeId: "", expiryDate: "", notes: "" });
      setFile(null);
      setErrors({});
      setTypeSearch("");
      setTypePickerOpen(false);
    }
  };

  const totalFilteredCount = Object.values(filteredGroupedTypes).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {/* Document Type Picker with Search */}
            <div className="space-y-2">
              <Label className={errors.documentType ? "text-red-600" : ""}>
                Document Type *
              </Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTypePickerOpen(!typePickerOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md bg-background transition-colors",
                    errors.documentType
                      ? "border-red-500 ring-1 ring-red-500"
                      : "border-input hover:border-slate-400",
                    !formData.documentTypeId && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {formData.documentTypeId
                      ? getSelectedTypeName()
                      : "Select document type"}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 ml-2 flex-shrink-0 transition-transform", typePickerOpen && "rotate-180")} />
                </button>

                {typePickerOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                    {/* Search input */}
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          ref={searchInputRef}
                          placeholder="Search document types..."
                          value={typeSearch}
                          onChange={(e) => setTypeSearch(e.target.value)}
                          className="h-8 pl-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Scrollable list */}
                    <div className="max-h-[250px] overflow-y-auto">
                      {totalFilteredCount === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No document types found
                        </div>
                      ) : (
                        Object.entries(filteredGroupedTypes).map(([category, types]) => (
                          <div key={category}>
                            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                              {category}
                            </div>
                            {types.map((type) => (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => handleSelectType(type.id)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                                  formData.documentTypeId === type.id && "bg-accent"
                                )}
                              >
                                {formData.documentTypeId === type.id ? (
                                  <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                ) : (
                                  <div className="w-3.5 flex-shrink-0" />
                                )}
                                <span className="truncate">{type.name}</span>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.documentType && (
                <p className="text-sm text-red-600">{errors.documentType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="file" className={errors.file ? "text-red-600" : ""}>
                File *
              </Label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                errors.file
                  ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}>
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    if (errors.file) setErrors({ ...errors, file: undefined });
                  }}
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
                      <Upload className={`h-8 w-8 mx-auto mb-2 ${errors.file ? "text-red-400" : "text-slate-400"}`} />
                      <p className={`text-sm ${errors.file ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}>
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                    </>
                  )}
                </label>
              </div>
              {errors.file && (
                <p className="text-sm text-red-600">{errors.file}</p>
              )}
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
