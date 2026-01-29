"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createInventoryItem, updateInventoryItem } from "@/lib/actions/inventory";
import { InventoryItemData, INVENTORY_UNITS } from "@/lib/inventory-utils";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  item: InventoryItemData | null;
  onSaved: () => void;
}

export function ItemDialog({
  open,
  onOpenChange,
  categories,
  item,
  onSaved,
}: ItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("units");

  const isEdit = item !== null;

  useEffect(() => {
    if (open) {
      if (item) {
        setCategoryId(item.categoryId);
        setUnit(item.unit);
      } else {
        setCategoryId("");
        setUnit("units");
      }
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const quantity = Number(formData.get("quantity") || 0);
    const minQuantity = Number(formData.get("minQuantity") || 0);
    const expiryDate = formData.get("expiryDate") as string;
    const batchNumber = formData.get("batchNumber") as string;
    const supplier = formData.get("supplier") as string;
    const supplierContact = formData.get("supplierContact") as string;
    const costPerUnit = formData.get("costPerUnit") as string;
    const location = formData.get("location") as string;
    const notes = formData.get("notes") as string;

    try {
      if (isEdit) {
        await updateInventoryItem(item.id, {
          name,
          categoryId,
          minQuantity,
          unit,
          expiryDate: expiryDate || null,
          batchNumber: batchNumber || null,
          supplier: supplier || null,
          supplierContact: supplierContact || null,
          costPerUnit: costPerUnit ? Number(costPerUnit) : null,
          location: location || null,
          notes: notes || null,
        });
        toast.success("Item updated successfully");
      } else {
        if (!categoryId) {
          toast.error("Please select a category");
          setLoading(false);
          return;
        }
        await createInventoryItem({
          name,
          categoryId,
          quantity,
          minQuantity,
          unit,
          expiryDate: expiryDate || null,
          batchNumber: batchNumber || null,
          supplier: supplier || null,
          supplierContact: supplierContact || null,
          costPerUnit: costPerUnit ? Number(costPerUnit) : null,
          location: location || null,
          notes: notes || null,
        });
        toast.success("Item created successfully");
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(isEdit ? "Failed to update item" : "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this inventory item."
              : "Add a new item to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={item?.name || ""}
                placeholder="Item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Initial Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  defaultValue="0"
                  placeholder="0"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="minQuantity">Minimum Quantity</Label>
              <Input
                id="minQuantity"
                name="minQuantity"
                type="number"
                min="0"
                defaultValue={item?.minQuantity ?? 0}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                defaultValue={formatDateForInput(item?.expiryDate ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                name="batchNumber"
                defaultValue={item?.batchNumber || ""}
                placeholder="Batch number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                name="supplier"
                defaultValue={item?.supplier || ""}
                placeholder="Supplier name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierContact">Supplier Contact</Label>
              <Input
                id="supplierContact"
                name="supplierContact"
                defaultValue={item?.supplierContact || ""}
                placeholder="Phone or email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost per Unit (R)</Label>
              <Input
                id="costPerUnit"
                name="costPerUnit"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.costPerUnit ?? ""}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                defaultValue={item?.location || ""}
                placeholder="Storage location"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={item?.notes || ""}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
