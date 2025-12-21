"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";

// ============= DOCUMENT CATEGORIES & TYPES =============

export const getDocumentCategoriesAdmin = cache(async () => {
  await requireSuperAdmin();

  return prisma.documentCategory.findMany({
    include: {
      DocumentType: {
        include: {
          _count: { select: { Document: true } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });
});

export async function createDocumentCategory(data: {
  name: string;
  description?: string;
  displayOrder?: number;
  icon?: string;
}) {
  await requireSuperAdmin();

  const category = await prisma.documentCategory.create({
    data: {
      id: crypto.randomUUID().replace(/-/g, "").substring(0, 25),
      name: data.name,
      description: data.description,
      displayOrder: data.displayOrder || 0,
      icon: data.icon,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/content");

  return category;
}

export async function updateDocumentCategory(id: string, data: {
  name?: string;
  description?: string;
  displayOrder?: number;
  icon?: string;
}) {
  await requireSuperAdmin();

  const category = await prisma.documentCategory.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });

  revalidatePath("/admin/content");

  return category;
}

export async function createDocumentType(data: {
  categoryId: string;
  name: string;
  description?: string;
  isRequired?: boolean;
  requiresExpiry?: boolean;
  defaultReviewMonths?: number;
  ohscMeasureNumber?: string;
  guidanceNotes?: string;
}) {
  await requireSuperAdmin();

  const docType = await prisma.documentType.create({
    data: {
      id: crypto.randomUUID().replace(/-/g, "").substring(0, 25),
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      isRequired: data.isRequired ?? true,
      requiresExpiry: data.requiresExpiry ?? false,
      defaultReviewMonths: data.defaultReviewMonths,
      ohscMeasureNumber: data.ohscMeasureNumber,
      guidanceNotes: data.guidanceNotes,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/content");

  return docType;
}

export async function updateDocumentType(id: string, data: {
  name?: string;
  description?: string;
  isRequired?: boolean;
  requiresExpiry?: boolean;
  defaultReviewMonths?: number;
  ohscMeasureNumber?: string;
  guidanceNotes?: string;
}) {
  await requireSuperAdmin();

  const docType = await prisma.documentType.update({
    where: { id },
    data: { ...data, updatedAt: new Date() },
  });

  revalidatePath("/admin/content");

  return docType;
}

export async function deleteDocumentType(id: string) {
  await requireSuperAdmin();

  // Check if any documents use this type
  const count = await prisma.document.count({ where: { documentTypeId: id } });

  if (count > 0) {
    throw new Error(`Cannot delete document type: ${count} documents are using it`);
  }

  await prisma.documentType.delete({ where: { id } });

  revalidatePath("/admin/content");
}

// ============= TASK TEMPLATES (Global) =============

export const getGlobalTaskTemplates = cache(async () => {
  await requireSuperAdmin();

  // Get templates that are used across multiple practices
  const templates = await prisma.taskTemplate.groupBy({
    by: ["name", "description", "frequency"],
    _count: true,
    orderBy: { _count: { name: "desc" } },
    take: 50,
  });

  return templates;
});

// ============= CONTENT STATS =============

export const getContentStats = cache(async () => {
  await requireSuperAdmin();

  const [
    documentCategories,
    documentTypes,
    totalDocuments,
    taskTemplates,
    trainingModules,
  ] = await Promise.all([
    prisma.documentCategory.count(),
    prisma.documentType.count(),
    prisma.document.count(),
    prisma.taskTemplate.count(),
    prisma.trainingModule.count(),
  ]);

  return {
    documentCategories,
    documentTypes,
    totalDocuments,
    taskTemplates,
    trainingModules,
  };
});
