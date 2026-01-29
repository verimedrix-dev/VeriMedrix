// Inventory Management - Types, constants, and helper functions

export const INVENTORY_UNITS = [
  "units",
  "boxes",
  "bottles",
  "vials",
  "packs",
  "tubes",
  "ampoules",
  "pairs",
  "rolls",
  "sachets",
] as const;

export type InventoryUnit = (typeof INVENTORY_UNITS)[number];

export const DEFAULT_CATEGORIES = [
  { name: "Medicines", description: "Pharmaceutical drugs and medications", sortOrder: 1 },
  { name: "Vaccines", description: "Immunization vaccines and biologicals", sortOrder: 2 },
  { name: "Consumables", description: "Bandages, gloves, syringes, and other disposables", sortOrder: 3 },
  { name: "Emergency Supplies", description: "Emergency kit items and resuscitation supplies", sortOrder: 4 },
  { name: "Equipment", description: "Medical devices and equipment", sortOrder: 5 },
  { name: "Other", description: "Miscellaneous items", sortOrder: 6 },
] as const;

export type ItemStatus = "ok" | "low_stock" | "expiring_soon" | "expired";

export interface InventoryItemData {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  minQuantity: number;
  unit: string;
  expiryDate: Date | null;
  batchNumber: string | null;
  supplier: string | null;
  supplierContact: string | null;
  costPerUnit: number | null;
  location: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  categoryName: string;
}

export interface InventoryDashboardData {
  items: InventoryItemData[];
  categories: { id: string; name: string; sortOrder: number; itemCount: number }[];
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export interface StockMovementData {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason: string | null;
  reference: string | null;
  performedById: string | null;
  createdAt: Date;
}

/**
 * Determine the status of an inventory item
 */
export function getItemStatus(item: { quantity: number; minQuantity: number; expiryDate: Date | null }): ItemStatus {
  const now = new Date();

  // Check if expired
  if (item.expiryDate && new Date(item.expiryDate) < now) {
    return "expired";
  }

  // Check if quantity is zero (also treat as expired/critical)
  if (item.quantity <= 0) {
    return "expired";
  }

  // Check if low stock
  if (item.quantity <= item.minQuantity) {
    return "low_stock";
  }

  // Check if expiring within 90 days
  if (item.expiryDate) {
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    if (new Date(item.expiryDate) <= ninetyDaysFromNow) {
      return "expiring_soon";
    }
  }

  return "ok";
}

/**
 * Get display label for item status
 */
export function getStatusLabel(status: ItemStatus): string {
  switch (status) {
    case "ok": return "In Stock";
    case "low_stock": return "Low Stock";
    case "expiring_soon": return "Expiring Soon";
    case "expired": return "Expired";
  }
}

/**
 * Get status color classes
 */
export function getStatusColor(status: ItemStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case "ok":
      return {
        bg: "bg-green-50 dark:bg-green-950/20",
        text: "text-green-700 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
        dot: "bg-green-500",
      };
    case "low_stock":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/20",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
      };
    case "expiring_soon":
      return {
        bg: "bg-orange-50 dark:bg-orange-950/20",
        text: "text-orange-700 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
        dot: "bg-orange-500",
      };
    case "expired":
      return {
        bg: "bg-red-50 dark:bg-red-950/20",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
        dot: "bg-red-500",
      };
  }
}

/**
 * Format quantity with unit
 */
export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity} ${unit}`;
}

/**
 * Format currency in South African Rand
 */
export function formatRand(amount: number | null): string {
  if (amount === null) return "-";
  return `R${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format expiry date with relative context
 */
export function formatExpiryDate(date: Date | null): string {
  if (!date) return "No expiry";
  const d = new Date(date);
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}
