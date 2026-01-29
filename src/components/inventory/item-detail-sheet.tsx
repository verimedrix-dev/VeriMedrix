"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InventoryItemData,
  StockMovementData,
  getItemStatus,
  getStatusLabel,
  getStatusColor,
  formatQuantity,
  formatRand,
  formatExpiryDate,
} from "@/lib/inventory-utils";
import { getStockMovements } from "@/lib/actions/inventory";

interface ItemDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItemData | null;
}

export function ItemDetailSheet({
  open,
  onOpenChange,
  item,
}: ItemDetailSheetProps) {
  const [movements, setMovements] = useState<StockMovementData[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (open && item) {
      setLoadingMovements(true);
      getStockMovements(item.id)
        .then((data) => setMovements(data))
        .catch(() => setMovements([]))
        .finally(() => setLoadingMovements(false));
    } else {
      setMovements([]);
    }
  }, [open, item]);

  if (!item) return null;

  const status = getItemStatus(item);
  const colors = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const detailRows: { label: string; value: string }[] = [
    { label: "Category", value: item.categoryName },
    { label: "Quantity", value: formatQuantity(item.quantity, item.unit) },
    { label: "Minimum Quantity", value: String(item.minQuantity) },
    { label: "Unit", value: item.unit },
    { label: "Expiry Date", value: formatExpiryDate(item.expiryDate) },
    { label: "Batch Number", value: item.batchNumber || "-" },
    { label: "SKU", value: item.sku || "-" },
    { label: "Supplier", value: item.supplier || "-" },
    { label: "Supplier Contact", value: item.supplierContact || "-" },
    { label: "Cost per Unit", value: formatRand(item.costPerUnit) },
    { label: "Location", value: item.location || "-" },
  ];

  const getMovementIcon = (type: StockMovementData["type"]) => {
    switch (type) {
      case "IN":
        return <ArrowDownToLine className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "OUT":
        return <ArrowUpFromLine className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getMovementColor = (type: StockMovementData["type"]) => {
    switch (type) {
      case "IN":
        return "text-green-600 dark:text-green-400";
      case "OUT":
        return "text-red-600 dark:text-red-400";
      case "ADJUSTMENT":
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getMovementBadgeClasses = (type: StockMovementData["type"]) => {
    switch (type) {
      case "IN":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "OUT":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "ADJUSTMENT":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  const formatMovementDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item.name}</SheetTitle>
          <SheetDescription>
            <Badge
              className={cn(
                "mt-1",
                colors.bg,
                colors.text,
                colors.border,
                "border"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", colors.dot)} />
              {statusLabel}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 pb-6">
          {/* Item Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Details
            </h3>
            <div className="space-y-2">
              {detailRows.map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {item.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Notes
              </h3>
              <p className="text-sm">{item.notes}</p>
            </div>
          )}

          <Separator />

          {/* Stock Movement History */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Stock Movement History
            </h3>

            {loadingMovements ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No stock movements recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="mt-0.5">{getMovementIcon(movement.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", getMovementBadgeClasses(movement.type))}
                        >
                          {movement.type}
                        </Badge>
                        <span className={cn("font-semibold text-sm", getMovementColor(movement.type))}>
                          {movement.type === "IN" ? "+" : movement.type === "OUT" ? "-" : ""}
                          {movement.quantity}
                        </span>
                      </div>
                      {movement.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {movement.reason}
                        </p>
                      )}
                      {movement.reference && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ref: {movement.reference}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatMovementDate(movement.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
