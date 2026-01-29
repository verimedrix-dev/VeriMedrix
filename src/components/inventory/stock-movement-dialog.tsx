"use client";

import { useState } from "react";
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
import { Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import { recordStockMovement } from "@/lib/actions/inventory";
import { InventoryItemData, formatQuantity } from "@/lib/inventory-utils";
import { cn } from "@/lib/utils";

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemData;
  onSaved: () => void;
}

export function StockMovementDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: StockMovementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");

  const quantityNum = Number(quantity) || 0;
  const resultingQuantity =
    type === "IN"
      ? item.quantity + quantityNum
      : Math.max(0, item.quantity - quantityNum);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (quantityNum <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const result = await recordStockMovement({
        itemId: item.id,
        type,
        quantity: quantityNum,
        reason: reason || null,
        reference: reference || null,
      });

      toast.success(
        `Stock ${type === "IN" ? "added" : "removed"} successfully. New quantity: ${result.newQuantity}`
      );
      onOpenChange(false);
      setQuantity("");
      setReason("");
      setReference("");
      setType("IN");
      onSaved();
    } catch (error) {
      toast.error("Failed to record stock movement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stock Movement</DialogTitle>
          <DialogDescription>
            Record stock in or out for{" "}
            <span className="font-medium text-foreground">{item.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-3 bg-muted/50">
          <p className="text-sm text-muted-foreground">Current Stock</p>
          <p className="text-lg font-semibold">
            {formatQuantity(item.quantity, item.unit)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Movement Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={type === "IN" ? "default" : "outline"}
                onClick={() => setType("IN")}
                className={cn(
                  "gap-2",
                  type === "IN" && "bg-green-600 hover:bg-green-700"
                )}
              >
                <ArrowDownToLine className="h-4 w-4" />
                Stock In
              </Button>
              <Button
                type="button"
                variant={type === "OUT" ? "default" : "outline"}
                onClick={() => setType("OUT")}
                className={cn(
                  "gap-2",
                  type === "OUT" && "bg-red-600 hover:bg-red-700"
                )}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                Stock Out
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-quantity">Quantity</Label>
            <Input
              id="movement-quantity"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-reason">Reason</Label>
            <Input
              id="movement-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Restocked from supplier"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-reference">Reference (optional)</Label>
            <Input
              id="movement-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-12345"
            />
          </div>

          {quantityNum > 0 && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm text-muted-foreground">Resulting Stock</p>
              <p className="text-lg font-semibold">
                {formatQuantity(resultingQuantity, item.unit)}
              </p>
            </div>
          )}

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
              Record Movement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
