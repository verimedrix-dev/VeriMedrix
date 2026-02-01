"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { getCachedData, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

// Default categories to seed on first load
const DEFAULT_CATEGORIES = [
  { name: "Medical Suppliers", description: "Medicines, pharmaceuticals, and consumables", sortOrder: 1 },
  { name: "Medical Equipment", description: "Diagnostic devices, examination tools, sterilization equipment", sortOrder: 2 },
  { name: "Laboratory Services", description: "Pathology labs, blood testing, specimen collection", sortOrder: 3 },
  { name: "Radiology & Imaging", description: "X-ray, ultrasound, MRI referral services", sortOrder: 4 },
  { name: "Waste Management", description: "Medical waste disposal, sharps containers, HCRW compliance", sortOrder: 5 },
  { name: "IT & Software", description: "Practice management systems, telehealth platforms, network support", sortOrder: 6 },
  { name: "Cleaning & Hygiene", description: "Infection control, facility cleaning, sanitization services", sortOrder: 7 },
  { name: "Linen & Laundry", description: "Medical linen supply and laundering services", sortOrder: 8 },
  { name: "Security", description: "Physical security, alarm systems, access control", sortOrder: 9 },
  { name: "Insurance", description: "Medical malpractice, professional indemnity, practice insurance", sortOrder: 10 },
  { name: "Legal & Compliance", description: "Healthcare law, OHSC compliance consultants, POPIA advisors", sortOrder: 11 },
  { name: "Accounting & Tax", description: "Bookkeeping, medical practice tax, BEE certificates", sortOrder: 12 },
  { name: "Training & CPD", description: "BLS training, CPD providers, clinical skills courses", sortOrder: 13 },
  { name: "Locum Agencies", description: "Temporary staffing, nurse agencies, locum placement", sortOrder: 14 },
  { name: "Building & Maintenance", description: "Plumbing, electrical, air conditioning, facility upgrades", sortOrder: 15 },
  { name: "Printing & Stationery", description: "Medical forms, prescription pads, office supplies", sortOrder: 16 },
  { name: "Oxygen & Gas Suppliers", description: "Medical oxygen, gas cylinder delivery", sortOrder: 17 },
];

const DIRECTORY_CACHE_KEY = "service-provider-directory";

async function ensureDefaultCategories() {
  const existing = await prisma.serviceProviderCategory.count();
  if (existing === 0) {
    await prisma.serviceProviderCategory.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
      })),
      skipDuplicates: true,
    });
  }
}

// =============================================================================
// READ OPERATIONS (SUPER_ADMIN only in admin panel)
// =============================================================================

export async function getServiceProviderDirectoryAdmin() {
  await requireSuperAdmin();

  return getCachedData(
    DIRECTORY_CACHE_KEY,
    async () => {
      return withDbConnection(async () => {
        await ensureDefaultCategories();

        const [providers, categories] = await Promise.all([
          prisma.serviceProvider.findMany({
            where: { isActive: true },
            include: {
              Category: {
                select: { id: true, name: true },
              },
            },
            orderBy: { name: "asc" },
          }),
          prisma.serviceProviderCategory.findMany({
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              _count: {
                select: {
                  Providers: { where: { isActive: true } },
                },
              },
            },
          }),
        ]);

        return {
          providers: providers.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            phone: p.phone,
            email: p.email,
            website: p.website,
            address: p.address,
            city: p.city,
            province: p.province,
            logoUrl: p.logoUrl,
            categoryId: p.categoryId,
            categoryName: p.Category.name,
          })),
          categories: categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            providerCount: c._count.Providers,
          })),
          totalProviders: providers.length,
        };
      });
    },
    CACHE_DURATIONS.MEDIUM
  );
}

// =============================================================================
// WRITE OPERATIONS (SUPER_ADMIN only)
// =============================================================================

export interface CreateServiceProviderInput {
  categoryId: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  logoUrl?: string | null;
}

export async function createServiceProviderAdmin(data: CreateServiceProviderInput) {
  await requireSuperAdmin();

  const provider = await prisma.serviceProvider.create({
    data: {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      phone: data.phone,
      email: data.email,
      website: data.website,
      address: data.address,
      city: data.city,
      province: data.province,
      logoUrl: data.logoUrl,
    },
  });

  await invalidateCache(DIRECTORY_CACHE_KEY);
  revalidatePath("/admin/service-providers");
  revalidatePath("/service-providers");
  return provider;
}

export async function updateServiceProviderAdmin(id: string, data: CreateServiceProviderInput) {
  await requireSuperAdmin();

  const existing = await prisma.serviceProvider.findFirst({ where: { id } });
  if (!existing) throw new Error("Provider not found");

  const provider = await prisma.serviceProvider.update({
    where: { id },
    data: {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      phone: data.phone,
      email: data.email,
      website: data.website,
      address: data.address,
      city: data.city,
      province: data.province,
      logoUrl: data.logoUrl,
    },
  });

  await invalidateCache(DIRECTORY_CACHE_KEY);
  revalidatePath("/admin/service-providers");
  revalidatePath("/service-providers");
  return provider;
}

export async function deleteServiceProviderAdmin(id: string) {
  await requireSuperAdmin();

  const existing = await prisma.serviceProvider.findFirst({ where: { id } });
  if (!existing) throw new Error("Provider not found");

  await prisma.serviceProvider.update({
    where: { id },
    data: { isActive: false },
  });

  await invalidateCache(DIRECTORY_CACHE_KEY);
  revalidatePath("/admin/service-providers");
  revalidatePath("/service-providers");
}
