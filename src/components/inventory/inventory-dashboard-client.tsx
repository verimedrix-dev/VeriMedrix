"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, Plus, Download } from "lucide-react";
import { InventoryStats } from "./inventory-stats";
import { CategoryFilter } from "./category-filter";
import { InventoryTable } from "./inventory-table";
import { ItemDialog } from "./item-dialog";
import { StockMovementDialog } from "./stock-movement-dialog";
import { ItemDetailSheet } from "./item-detail-sheet";
import { InventoryDashboardData, InventoryItemData } from "@/lib/inventory-utils";
import { deleteInventoryItem } from "@/lib/actions/inventory";
import { toast } from "sonner";

interface InventoryDashboardClientProps {
  initialData: InventoryDashboardData | null;
}

export function InventoryDashboardClient({ initialData }: InventoryDashboardClientProps) {
  const router = useRouter();
  const data = initialData;

  // Dialog states
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemData | null>(null);
  const [stockMoveItem, setStockMoveItem] = useState<InventoryItemData | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItemData | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter items by category
  const filteredItems = data?.items.filter((item) => {
    if (!selectedCategory) return true;
    return item.categoryId === selectedCategory;
  }) ?? [];

  const handleAddItem = () => {
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItemData) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleStockMove = (item: InventoryItemData) => {
    setStockMoveItem(item);
  };

  const handleDeleteItem = async (item: InventoryItemData) => {
    if (!confirm(`Are you sure you want to remove "${item.name}" from inventory?`)) return;
    try {
      await deleteInventoryItem(item.id);
      toast.success(`"${item.name}" removed from inventory`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete item");
    }
  };

  const handleViewDetail = (item: InventoryItemData) => {
    setDetailItem(item);
  };

  const handleSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  // CSV export
  const handleExport = () => {
    if (!data?.items.length) {
      toast.error("No items to export");
      return;
    }
    const headers = ["Name", "Category", "Quantity", "Unit", "Min Qty", "Expiry Date", "Batch Number", "Supplier", "Location", "Cost per Unit", "Notes"];
    const rows = data.items.map((item) => [
      item.name,
      item.categoryName,
      item.quantity.toString(),
      item.unit,
      item.minQuantity.toString(),
      item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("en-ZA") : "",
      item.batchNumber || "",
      item.supplier || "",
      item.location || "",
      item.costPerUnit?.toString() || "",
      item.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Inventory exported to CSV");
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Unable to load inventory data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            Inventory Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track stock levels, expiry dates, and supplies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <InventoryStats
        totalItems={data.totalItems}
        lowStockCount={data.lowStockCount}
        expiringSoonCount={data.expiringSoonCount}
        expiredCount={data.expiredCount}
      />

      {/* Category Filter */}
      <CategoryFilter
        categories={data.categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Inventory Table */}
      <InventoryTable
        items={filteredItems}
        onEdit={handleEditItem}
        onStockMove={handleStockMove}
        onDelete={handleDeleteItem}
        onViewDetail={handleViewDetail}
      />

      {/* Add/Edit Item Dialog */}
      <ItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        categories={data.categories}
        item={editingItem}
        onSaved={handleSaved}
      />

      {/* Stock Movement Dialog */}
      {stockMoveItem && (
        <StockMovementDialog
          open={!!stockMoveItem}
          onOpenChange={(open) => { if (!open) setStockMoveItem(null); }}
          item={stockMoveItem}
          onSaved={handleSaved}
        />
      )}

      {/* Item Detail Sheet */}
      <ItemDetailSheet
        open={!!detailItem}
        onOpenChange={(open) => { if (!open) setDetailItem(null); }}
        item={detailItem}
      />
    </div>
  );
}
