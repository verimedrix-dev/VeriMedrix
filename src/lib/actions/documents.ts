"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";
import crypto from "crypto";

// Generate cuid-like IDs for models that don't have @default(cuid())
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 25);
}

const BUCKET_NAME = "documents";

// Default empty data for error fallback
const emptyDocumentsData = {
  documents: [],
  categories: [],
  stats: { total: 0, current: 0, expiringSoon: 0, expired: 0 }
};

// Optimized: Single auth call + parallel DB queries for documents page with Redis caching
export async function getDocumentsPageData() {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return getCachedData(
      cacheKeys.practiceDocuments(practice.id),
      async () => {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        return withDbConnection(async () => {
          const [documents, categories, stats] = await Promise.all([
            prisma.document.findMany({
              where: { practiceId: practice.id },
              select: {
                id: true,
                title: true,
                fileName: true,
                fileUrl: true,
                fileSize: true,
                expiryDate: true,
                status: true,
                version: true,
                createdAt: true,
                notes: true,
                DocumentType: {
                  select: {
                    id: true,
                    name: true,
                    DocumentCategory: { select: { id: true, name: true } }
                  }
                },
                User_Document_uploadedByIdToUser: {
                  select: { id: true, name: true }
                },
              },
              orderBy: { createdAt: "desc" },
              take: 100
            }),
            prisma.documentCategory.findMany({
              select: {
                id: true,
                name: true,
                displayOrder: true,
                DocumentType: { select: { id: true, name: true } }
              },
              orderBy: { displayOrder: "asc" }
            }),
            prisma.$queryRaw<[{ total: bigint; current: bigint; expiring: bigint; expired: bigint }]>`
              SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE "expiryDate" IS NULL OR "expiryDate" > ${thirtyDaysFromNow}) as current,
                COUNT(*) FILTER (WHERE "expiryDate" > ${now} AND "expiryDate" <= ${thirtyDaysFromNow}) as expiring,
                COUNT(*) FILTER (WHERE "expiryDate" < ${now}) as expired
              FROM "Document"
              WHERE "practiceId" = ${practice.id}
            `
          ]);

          const s = stats[0];
          return {
            documents,
            categories,
            stats: {
              total: Number(s?.total || 0),
              current: Number(s?.current || 0),
              expiringSoon: Number(s?.expiring || 0),
              expired: Number(s?.expired || 0)
            }
          };
        });
      },
      CACHE_DURATIONS.SHORT // 1 minute
    );
  } catch (error) {
    console.error("Documents page data fetch error:", error);
    return emptyDocumentsData;
  }
}

export async function getDocuments() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.document.findMany({
    where: { practiceId: practice.id },
    include: {
      DocumentType: {
        include: { DocumentCategory: true }
      },
      User_Document_uploadedByIdToUser: true,
    },
    orderBy: { createdAt: "desc" }
  });
}

// Lightweight documents for calendar - only essential fields
export const getDocumentsForCalendar = cache(async () => {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await prisma.document.findMany({
    where: {
      practiceId: practice.id,
      expiryDate: { not: null }
    },
    select: {
      id: true,
      title: true,
      expiryDate: true,
      status: true,
    },
    orderBy: { expiryDate: "asc" }
  });
});

// Cache document types for 1 hour - they rarely change
export const getDocumentTypes = unstable_cache(
  async () => {
    return await prisma.documentType.findMany({
      include: { DocumentCategory: true },
      orderBy: [
        { DocumentCategory: { displayOrder: "asc" } },
        { name: "asc" }
      ]
    });
  },
  ["document-types"],
  { revalidate: 3600 } // 1 hour
);

// Cache document categories for 1 hour - they rarely change
export const getDocumentCategories = unstable_cache(
  async () => {
    return await prisma.documentCategory.findMany({
      include: {
        DocumentType: true
      },
      orderBy: { displayOrder: "asc" }
    });
  },
  ["document-categories"],
  { revalidate: 3600 } // 1 hour
);

export async function createDocument(data: {
  documentTypeId: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  expiryDate?: Date | null;
  notes?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const document = await prisma.document.create({
    data: {
      id: generateId(),
      practiceId: practice.id,
      documentTypeId: data.documentTypeId,
      title: data.title,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedById: user.id,
      expiryDate: data.expiryDate,
      notes: data.notes,
      status: "CURRENT",
      updatedAt: new Date(),
    }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceDocuments(practice.id)),
    invalidateCache(cacheKeys.practiceDocumentStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return document;
}

export async function updateDocument(id: string, data: {
  title?: string;
  expiryDate?: Date | null;
  notes?: string;
  status?: "CURRENT" | "EXPIRING_SOON" | "EXPIRED" | "NEEDS_REVIEW" | "PENDING_APPROVAL";
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const document = await prisma.document.update({
    where: { id, practiceId: practice.id },
    data
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceDocuments(practice.id)),
    invalidateCache(cacheKeys.practiceDocumentStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return document;
}

export async function deleteDocument(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  await prisma.document.delete({
    where: { id, practiceId: practice.id }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceDocuments(practice.id)),
    invalidateCache(cacheKeys.practiceDocumentStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

export async function getDocumentStats() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Single aggregated query instead of 4 separate counts
  const stats = await prisma.$queryRaw<[{ total: bigint; current: bigint; expiring: bigint; expired: bigint }]>`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE "expiryDate" IS NULL OR "expiryDate" > ${thirtyDaysFromNow}) as current,
      COUNT(*) FILTER (WHERE "expiryDate" > ${now} AND "expiryDate" <= ${thirtyDaysFromNow}) as expiring,
      COUNT(*) FILTER (WHERE "expiryDate" < ${now}) as expired
    FROM "Document"
    WHERE "practiceId" = ${practice.id}
  `;

  const s = stats[0];
  return {
    total: Number(s?.total || 0),
    current: Number(s?.current || 0),
    expiringSoon: Number(s?.expiring || 0),
    expired: Number(s?.expired || 0)
  };
}

export async function uploadNewVersion(data: {
  documentId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  // Verify document belongs to this practice
  const existingDoc = await prisma.document.findFirst({
    where: { id: data.documentId, practiceId: practice.id }
  });

  if (!existingDoc) {
    throw new Error("Document not found");
  }

  // Update document with new version
  const document = await prisma.document.update({
    where: { id: data.documentId },
    data: {
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      version: existingDoc.version + 1,
      status: "CURRENT", // Reset status on new upload
    }
  });

  // Invalidate caches
  await Promise.all([
    invalidateCache(cacheKeys.practiceDocuments(practice.id)),
    invalidateCache(cacheKeys.practiceDocumentStats(practice.id)),
    invalidateCache(cacheKeys.practiceDashboard(practice.id)),
  ]);

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  return document;
}

export async function getDocumentById(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return await prisma.document.findFirst({
    where: { id, practiceId: practice.id },
    include: {
      DocumentType: {
        include: { DocumentCategory: true }
      },
      User_Document_uploadedByIdToUser: true,
    }
  });
}

export async function getDocumentDownloadUrl(documentId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const doc = await prisma.document.findFirst({
    where: { id: documentId, practiceId: practice.id }
  });

  if (!doc) {
    throw new Error("Document not found");
  }

  // If it's a Supabase storage URL, create a signed URL
  if (doc.fileUrl.includes("supabase")) {
    const { getSignedDownloadUrl } = await import("@/lib/supabase/storage");
    // Extract the path from the URL
    const urlParts = doc.fileUrl.split("/storage/v1/object/public/documents/");
    if (urlParts.length > 1) {
      const signedUrl = await getSignedDownloadUrl(urlParts[1]);
      return { url: signedUrl, fileName: doc.fileName || doc.title };
    }
  }

  // For other URLs, return as-is
  return { url: doc.fileUrl, fileName: doc.fileName || doc.title };
}

export async function uploadDocumentFile(formData: FormData) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const supabase = await createClient();

  // Create unique file path: practiceId/timestamp-filename
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${practice.id}/${timestamp}-${safeName}`;

  // Convert file to array buffer
  const arrayBuffer = await file.arrayBuffer();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
