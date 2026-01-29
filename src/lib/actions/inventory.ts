"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { getCachedData, CACHE_DURATIONS, invalidateCache, cacheKeys } from "@/lib/redis";
import { isFeatureAvailable } from "@/lib/subscription-config";
import { Decimal } from "@prisma/client/runtime/library";
import { createId } from "@paralleldrive/cuid2";
import { DEFAULT_CATEGORIES, InventoryItemData, InventoryDashboardData, StockMovementData } from "@/lib/inventory-utils";

// Cache keys
const inventoryCacheKey = (practiceId: string) => `practice:${practiceId}:inventory`;
const inventoryCategoriesCacheKey = (practiceId: string) => `practice:${practiceId}:inventory-categories`;

function decimalToNumber(value: Decimal | null): number | null {
  if (value === null) return null;
  return value.toNumber();
}

// Ensure inventory feature is available
async function ensureInventoryAccess() {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");
  if (!isFeatureAvailable(practice.subscriptionTier, "inventory")) {
    throw new Error("Inventory Management is only available on the Professional plan");
  }
  return { user, practice };
}

// Ensure default categories exist for a practice
async function ensureDefaultCategories(practiceId: string) {
  const existing = await prisma.inventoryCategory.count({
    where: { practiceId },
  });

  if (existing === 0) {
    await prisma.inventoryCategory.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        practiceId,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
      })),
      skipDuplicates: true,
    });
  }
}

// Get inventory dashboard data
export async function getInventoryDashboardData(): Promise<InventoryDashboardData | null | { featureNotAvailable: true }> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  if (!isFeatureAvailable(practice.subscriptionTier, "inventory")) {
    return { featureNotAvailable: true };
  }

  return getCachedData(
    inventoryCacheKey(practice.id),
    async () => {
      return withDbConnection(async () => {
        // Ensure default categories exist
        await ensureDefaultCategories(practice.id);

        const now = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

        // Get all active items with category
        const items = await prisma.inventoryItem.findMany({
          where: {
            practiceId: practice.id,
            isActive: true,
          },
          include: {
            Category: {
              select: { name: true },
            },
          },
          orderBy: { name: "asc" },
        });

        // Get categories with item counts
        const categories = await prisma.inventoryCategory.findMany({
          where: { practiceId: practice.id },
          orderBy: { sortOrder: "asc" },
          include: {
            _count: {
              select: {
                Items: {
                  where: { isActive: true },
                },
              },
            },
          },
        });

        // Transform items
        const transformedItems: InventoryItemData[] = items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          unit: item.unit,
          expiryDate: item.expiryDate,
          batchNumber: item.batchNumber,
          supplier: item.supplier,
          supplierContact: item.supplierContact,
          costPerUnit: decimalToNumber(item.costPerUnit),
          location: item.location,
          notes: item.notes,
          isActive: item.isActive,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          categoryId: item.categoryId,
          categoryName: item.Category.name,
        }));

        // Calculate alert counts
        let lowStockCount = 0;
        let expiringSoonCount = 0;
        let expiredCount = 0;

        for (const item of items) {
          if (item.expiryDate && item.expiryDate < now) {
            expiredCount++;
          } else if (item.quantity <= 0) {
            expiredCount++;
          } else if (item.quantity <= item.minQuantity) {
            lowStockCount++;
          } else if (item.expiryDate && item.expiryDate <= ninetyDaysFromNow) {
            expiringSoonCount++;
          }
        }

        return {
          items: transformedItems,
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            sortOrder: cat.sortOrder,
            itemCount: cat._count.Items,
          })),
          totalItems: items.length,
          lowStockCount,
          expiringSoonCount,
          expiredCount,
        };
      });
    },
    CACHE_DURATIONS.SHORT
  );
}

// Get categories for dropdowns
export async function getInventoryCategories() {
  const { practice } = await ensureInventoryAccess();

  return getCachedData(
    inventoryCategoriesCacheKey(practice.id),
    async () => {
      await ensureDefaultCategories(practice.id);
      const categories = await prisma.inventoryCategory.findMany({
        where: { practiceId: practice.id },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, sortOrder: true },
      });
      return categories;
    },
    CACHE_DURATIONS.MEDIUM
  );
}

// Create inventory item input
export interface CreateInventoryItemInput {
  categoryId: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  quantity: number;
  minQuantity?: number;
  unit?: string;
  expiryDate?: string | null; // ISO string
  batchNumber?: string | null;
  supplier?: string | null;
  supplierContact?: string | null;
  costPerUnit?: number | null;
  location?: string | null;
  notes?: string | null;
}

// Create a new inventory item
export async function createInventoryItem(data: CreateInventoryItemInput) {
  const { user, practice } = await ensureInventoryAccess();

  const item = await prisma.inventoryItem.create({
    data: {
      practiceId: practice.id,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      sku: data.sku,
      quantity: data.quantity,
      minQuantity: data.minQuantity ?? 0,
      unit: data.unit ?? "units",
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      batchNumber: data.batchNumber,
      supplier: data.supplier,
      supplierContact: data.supplierContact,
      costPerUnit: data.costPerUnit,
      location: data.location,
      notes: data.notes,
      createdById: user.id,
    },
  });

  // Record initial stock movement if quantity > 0
  if (data.quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        practiceId: practice.id,
        itemId: item.id,
        type: "IN",
        quantity: data.quantity,
        reason: "Initial stock",
        performedById: user.id,
      },
    });
  }

  await invalidateCache(inventoryCacheKey(practice.id));
  revalidatePath("/inventory");

  return { ...item, costPerUnit: decimalToNumber(item.costPerUnit) };
}

// Update inventory item input
export interface UpdateInventoryItemInput {
  name?: string;
  description?: string | null;
  categoryId?: string;
  sku?: string | null;
  minQuantity?: number;
  unit?: string;
  expiryDate?: string | null;
  batchNumber?: string | null;
  supplier?: string | null;
  supplierContact?: string | null;
  costPerUnit?: number | null;
  location?: string | null;
  notes?: string | null;
}

// Update an existing inventory item
export async function updateInventoryItem(id: string, data: UpdateInventoryItemInput) {
  const { practice } = await ensureInventoryAccess();

  // Verify item belongs to practice
  const existing = await prisma.inventoryItem.findFirst({
    where: { id, practiceId: practice.id },
  });
  if (!existing) throw new Error("Item not found");

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      sku: data.sku,
      minQuantity: data.minQuantity,
      unit: data.unit,
      expiryDate: data.expiryDate !== undefined ? (data.expiryDate ? new Date(data.expiryDate) : null) : undefined,
      batchNumber: data.batchNumber,
      supplier: data.supplier,
      supplierContact: data.supplierContact,
      costPerUnit: data.costPerUnit,
      location: data.location,
      notes: data.notes,
    },
  });

  await invalidateCache(inventoryCacheKey(practice.id));
  revalidatePath("/inventory");

  return { ...item, costPerUnit: decimalToNumber(item.costPerUnit) };
}

// Delete (soft) an inventory item
export async function deleteInventoryItem(id: string) {
  const { practice } = await ensureInventoryAccess();

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, practiceId: practice.id },
  });
  if (!existing) throw new Error("Item not found");

  await prisma.inventoryItem.update({
    where: { id },
    data: { isActive: false },
  });

  await invalidateCache(inventoryCacheKey(practice.id));
  revalidatePath("/inventory");
}

// Record stock movement input
export interface RecordStockMovementInput {
  itemId: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  reason?: string | null;
  reference?: string | null;
}

// Record a stock movement (in/out/adjustment)
export async function recordStockMovement(data: RecordStockMovementInput) {
  const { user, practice } = await ensureInventoryAccess();

  // Verify item belongs to practice
  const item = await prisma.inventoryItem.findFirst({
    where: { id: data.itemId, practiceId: practice.id, isActive: true },
  });
  if (!item) throw new Error("Item not found");

  if (data.quantity <= 0) throw new Error("Quantity must be greater than 0");

  // Calculate new quantity
  let newQuantity = item.quantity;
  if (data.type === "IN") {
    newQuantity += data.quantity;
  } else if (data.type === "OUT") {
    newQuantity -= data.quantity;
    if (newQuantity < 0) newQuantity = 0;
  } else {
    // ADJUSTMENT sets absolute quantity
    newQuantity = data.quantity;
  }

  // Update item quantity and create movement in a transaction
  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        practiceId: practice.id,
        itemId: data.itemId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
        performedById: user.id,
      },
    }),
    prisma.inventoryItem.update({
      where: { id: data.itemId },
      data: { quantity: newQuantity },
    }),
  ]);

  await invalidateCache(inventoryCacheKey(practice.id));
  revalidatePath("/inventory");

  return { newQuantity };
}

// Get stock movement history for an item
export async function getStockMovements(itemId: string): Promise<StockMovementData[]> {
  const { practice } = await ensureInventoryAccess();

  const movements = await prisma.stockMovement.findMany({
    where: {
      itemId,
      practiceId: practice.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return movements.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    reason: m.reason,
    reference: m.reference,
    performedById: m.performedById,
    createdAt: m.createdAt,
  }));
}

// Get a single inventory item with details
export async function getInventoryItem(id: string) {
  const { practice } = await ensureInventoryAccess();

  const item = await prisma.inventoryItem.findFirst({
    where: { id, practiceId: practice.id },
    include: {
      Category: { select: { name: true } },
    },
  });

  if (!item) return null;

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    unit: item.unit,
    expiryDate: item.expiryDate,
    batchNumber: item.batchNumber,
    supplier: item.supplier,
    supplierContact: item.supplierContact,
    costPerUnit: decimalToNumber(item.costPerUnit),
    location: item.location,
    notes: item.notes,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    categoryId: item.categoryId,
    categoryName: item.Category.name,
  };
}

/**
 * Check inventory for alerts and create IN_APP notifications.
 * Called when the inventory dashboard loads. Creates alerts for:
 * - Items with quantity at or below minimum (low stock)
 * - Items expiring within 30 days
 * - Items already expired
 *
 * Avoids duplicates by checking if a PENDING alert already exists
 * for the same item and alert type (via message matching).
 */
export async function checkInventoryAlerts() {
  try {
    const { user, practice } = await ensureUserAndPractice();
    if (!practice || !user) return;
    if (!isFeatureAvailable(practice.subscriptionTier, "inventory")) return;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all active items
    const items = await prisma.inventoryItem.findMany({
      where: {
        practiceId: practice.id,
        isActive: true,
      },
      include: {
        Category: { select: { name: true } },
      },
    });

    // Get existing PENDING inventory alerts for this practice to avoid duplicates
    const existingAlerts = await prisma.alert.findMany({
      where: {
        practiceId: practice.id,
        status: "PENDING",
        alertType: {
          in: ["INVENTORY_LOW_STOCK", "INVENTORY_EXPIRING", "INVENTORY_EXPIRED"],
        },
      },
      select: { message: true },
    });
    const existingMessages = new Set(existingAlerts.map((a) => a.message));

    // Find practice owners/admins to notify
    const recipients = await prisma.user.findMany({
      where: {
        practiceId: practice.id,
        isActive: true,
        role: { in: ["PRACTICE_OWNER", "ADMIN"] },
      },
      select: { id: true },
    });

    if (recipients.length === 0) return;

    const alertsToCreate: {
      alertType: "INVENTORY_LOW_STOCK" | "INVENTORY_EXPIRING" | "INVENTORY_EXPIRED";
      message: string;
    }[] = [];

    for (const item of items) {
      // Check expired
      if (item.expiryDate && item.expiryDate < now) {
        const msg = `Expired: "${item.name}" (${item.Category.name}) expired on ${item.expiryDate.toLocaleDateString("en-ZA")}. Please dispose or replace.`;
        if (!existingMessages.has(msg)) {
          alertsToCreate.push({ alertType: "INVENTORY_EXPIRED", message: msg });
        }
      }
      // Check expiring soon (within 30 days, but not expired)
      else if (item.expiryDate && item.expiryDate <= thirtyDaysFromNow) {
        const daysLeft = Math.ceil((item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const msg = `Expiring soon: "${item.name}" (${item.Category.name}) expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Consider restocking.`;
        if (!existingMessages.has(msg)) {
          alertsToCreate.push({ alertType: "INVENTORY_EXPIRING", message: msg });
        }
      }

      // Check low stock (quantity <= minQuantity and minQuantity > 0)
      if (item.quantity <= item.minQuantity && item.minQuantity > 0) {
        const msg = `Low stock: "${item.name}" (${item.Category.name}) has ${item.quantity} ${item.unit} remaining (minimum: ${item.minQuantity}).`;
        if (!existingMessages.has(msg)) {
          alertsToCreate.push({ alertType: "INVENTORY_LOW_STOCK", message: msg });
        }
      }
    }

    // Batch create alerts for all recipients
    if (alertsToCreate.length > 0) {
      const data = alertsToCreate.flatMap((alert) =>
        recipients.map((r) => ({
          id: createId(),
          practiceId: practice.id,
          recipientId: r.id,
          alertType: alert.alertType,
          message: alert.message,
          channel: "IN_APP" as const,
          scheduledFor: now,
          status: "PENDING" as const,
        }))
      );

      await prisma.alert.createMany({ data });
      await invalidateCache(cacheKeys.practiceAlerts(practice.id));
      revalidatePath("/notifications");
    }
  } catch (error) {
    console.error("checkInventoryAlerts error:", error);
  }
}
