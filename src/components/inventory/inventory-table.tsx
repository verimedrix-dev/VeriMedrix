"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Pencil,
  ArrowUpDown,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InventoryItemData,
  getItemStatus,
  getStatusLabel,
  getStatusColor,
  formatQuantity,
  formatExpiryDate,
} from "@/lib/inventory-utils";

interface InventoryTableProps {
  items: InventoryItemData[];
  onEdit: (item: InventoryItemData) => void;
  onStockMove: (item: InventoryItemData) => void;
  onDelete: (item: InventoryItemData) => void;
  onViewDetail: (item: InventoryItemData) => void;
}

export function InventoryTable({
  items,
  onEdit,
  onStockMove,
  onDelete,
  onViewDetail,
}: InventoryTableProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return [...items].sort((a, b) => a.name.localeCompare(b.name));
    return [...items]
      .filter((item) => item.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">Status</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Min Qty</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {search ? "No items match your search." : "No inventory items found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const status = getItemStatus(item);
                const colors = getStatusColor(status);
                const statusLabel = getStatusLabel(status);

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      status !== "ok" && colors.bg
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <div
                          className={cn("h-2.5 w-2.5 rounded-full", colors.dot)}
                          title={statusLabel}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        className="font-medium text-left hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => onViewDetail(item)}
                      >
                        {item.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.categoryName}
                    </TableCell>
                    <TableCell>
                      <span className={cn(status === "low_stock" || status === "expired" ? colors.text : "")}>
                        {formatQuantity(item.quantity, item.unit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.minQuantity}
                    </TableCell>
                    <TableCell>
                      <span className={cn(status === "expiring_soon" || status === "expired" ? colors.text : "text-muted-foreground")}>
                        {formatExpiryDate(item.expiryDate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.location || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetail(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStockMove(item)}>
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            Stock Movement
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(item)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredItems.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {items.length} items
        </p>
      )}
    </div>
  );
}
