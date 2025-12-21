"use client";

import { useState, useTransition } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { createDocumentType } from "@/lib/actions/admin/content";
import { useRouter } from "next/navigation";

interface AddDocTypeDialogProps {
  categoryId: string;
  categoryName: string;
}

export function AddDocTypeDialog({ categoryId, categoryName }: AddDocTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isRequired: true,
    requiresExpiry: false,
    defaultReviewMonths: undefined as number | undefined,
    ohscMeasureNumber: "",
    guidanceNotes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await createDocumentType({
        categoryId,
        ...formData,
      });
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        isRequired: true,
        requiresExpiry: false,
        defaultReviewMonths: undefined,
        ohscMeasureNumber: "",
        guidanceNotes: "",
      });
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Type
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Document Type</DialogTitle>
            <DialogDescription>
              Create a new document type in the &ldquo;{categoryName}&rdquo; category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Document Type Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fire Safety Policy"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this document type..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ohscMeasureNumber">OHSC Measure Number</Label>
              <Input
                id="ohscMeasureNumber"
                value={formData.ohscMeasureNumber}
                onChange={(e) => setFormData({ ...formData, ohscMeasureNumber: e.target.value })}
                placeholder="e.g., 2.1.1"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRequired: checked === true })
                  }
                />
                <Label htmlFor="isRequired" className="text-sm font-normal">
                  Required document
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresExpiry"
                  checked={formData.requiresExpiry}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresExpiry: checked === true })
                  }
                />
                <Label htmlFor="requiresExpiry" className="text-sm font-normal">
                  Has expiry date
                </Label>
              </div>
            </div>

            {formData.requiresExpiry && (
              <div className="space-y-2">
                <Label htmlFor="defaultReviewMonths">Default Review Period (months)</Label>
                <Input
                  id="defaultReviewMonths"
                  type="number"
                  value={formData.defaultReviewMonths || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultReviewMonths: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g., 12"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="guidanceNotes">Guidance Notes</Label>
              <Textarea
                id="guidanceNotes"
                value={formData.guidanceNotes}
                onChange={(e) => setFormData({ ...formData, guidanceNotes: e.target.value })}
                placeholder="Additional guidance for practices..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !formData.name}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Document Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
