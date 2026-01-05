"use server";

import { prisma } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";
import { ComplaintCategory, Severity, ComplaintStatus, ResolutionType } from "@prisma/client";

// Extend cache keys for complaints
const complaintsCacheKey = (practiceId: string) => `practice:${practiceId}:complaints`;

// Generate reference number: CMP-2025-001
async function generateReferenceNumber(practiceId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.complaint.count({
    where: {
      practiceId,
      referenceNumber: { startsWith: `CMP-${year}` }
    }
  });
  return `CMP-${year}-${String(count + 1).padStart(3, "0")}`;
}

// Get all complaints with stats
export async function getComplaintsPageData() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return getCachedData(
    complaintsCacheKey(practice.id),
    async () => {
      const [complaints, stats] = await Promise.all([
        prisma.complaint.findMany({
          where: { practiceId: practice.id },
          orderBy: { dateReceived: "desc" },
          take: 100,
        }),
        // Single aggregated query for stats
        prisma.$queryRaw<[{
          total: bigint;
          received: bigint;
          acknowledged: bigint;
          investigating: bigint;
          resolved: bigint;
          closed: bigint;
          overdue_ack: bigint;
        }]>`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'RECEIVED') as received,
            COUNT(*) FILTER (WHERE status = 'ACKNOWLEDGED') as acknowledged,
            COUNT(*) FILTER (WHERE status = 'INVESTIGATING') as investigating,
            COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved,
            COUNT(*) FILTER (WHERE status = 'CLOSED') as closed,
            COUNT(*) FILTER (WHERE status = 'RECEIVED' AND "dateReceived" < NOW() - INTERVAL '5 days') as overdue_ack
          FROM "Complaint"
          WHERE "practiceId" = ${practice.id}
        `
      ]);

      const s = stats[0];
      return {
        complaints,
        stats: {
          total: Number(s?.total || 0),
          received: Number(s?.received || 0),
          acknowledged: Number(s?.acknowledged || 0),
          investigating: Number(s?.investigating || 0),
          resolved: Number(s?.resolved || 0),
          closed: Number(s?.closed || 0),
          overdueAcknowledgement: Number(s?.overdue_ack || 0), // OHSC requires acknowledgement within 5 working days
        }
      };
    },
    CACHE_DURATIONS.SHORT
  );
}

// Get single complaint by ID
export async function getComplaint(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return prisma.complaint.findFirst({
    where: { id, practiceId: practice.id }
  });
}

// Create a new complaint
export async function createComplaint(data: {
  dateReceived: Date;
  complainantName?: string;
  complainantContact?: string;
  category: ComplaintCategory;
  severity?: Severity;
  summary: string;
  details?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const referenceNumber = await generateReferenceNumber(practice.id);

  const complaint = await prisma.complaint.create({
    data: {
      practiceId: practice.id,
      referenceNumber,
      dateReceived: data.dateReceived,
      complainantName: data.complainantName,
      complainantContact: data.complainantContact,
      category: data.category,
      severity: data.severity || "MEDIUM",
      summary: data.summary,
      details: data.details,
      status: "RECEIVED",
      createdBy: user.id,
    }
  });

  // Invalidate cache
  await invalidateCache(complaintsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/complaints");
  revalidatePath("/dashboard");
  return complaint;
}

// Update complaint
export async function updateComplaint(id: string, data: {
  complainantName?: string;
  complainantContact?: string;
  category?: ComplaintCategory;
  severity?: Severity;
  summary?: string;
  details?: string;
  status?: ComplaintStatus;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = { ...data };

  // Auto-set acknowledgedAt when status changes to ACKNOWLEDGED
  if (data.status === "ACKNOWLEDGED") {
    const existing = await prisma.complaint.findFirst({
      where: { id, practiceId: practice.id },
      select: { acknowledgedAt: true }
    });
    if (!existing?.acknowledgedAt) {
      updateData.acknowledgedAt = new Date();
    }
  }

  // Auto-set resolvedAt when status changes to RESOLVED
  if (data.status === "RESOLVED") {
    const existing = await prisma.complaint.findFirst({
      where: { id, practiceId: practice.id },
      select: { resolvedAt: true }
    });
    if (!existing?.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
  }

  const complaint = await prisma.complaint.update({
    where: { id, practiceId: practice.id },
    data: updateData
  });

  await invalidateCache(complaintsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/complaints");
  revalidatePath("/dashboard");
  return complaint;
}

// Acknowledge a complaint (OHSC requires within 5 working days)
export async function acknowledgeComplaint(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const complaint = await prisma.complaint.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "ACKNOWLEDGED",
      acknowledgedAt: new Date()
    }
  });

  await invalidateCache(complaintsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/complaints");
  return complaint;
}

// Start investigation
export async function startInvestigation(id: string, investigatedBy: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const complaint = await prisma.complaint.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "INVESTIGATING",
      investigatedBy,
      investigationDate: new Date()
    }
  });

  await invalidateCache(complaintsCacheKey(practice.id));

  revalidatePath("/complaints");
  return complaint;
}

// Record investigation findings
export async function recordInvestigationFindings(id: string, data: {
  investigationNotes: string;
  rootCause?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const complaint = await prisma.complaint.update({
    where: { id, practiceId: practice.id },
    data: {
      investigationNotes: data.investigationNotes,
      rootCause: data.rootCause
    }
  });

  await invalidateCache(complaintsCacheKey(practice.id));

  revalidatePath("/complaints");
  return complaint;
}

// Resolve complaint
export async function resolveComplaint(id: string, data: {
  resolutionSummary: string;
  resolutionType: ResolutionType;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const complaint = await prisma.complaint.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolutionSummary: data.resolutionSummary,
      resolutionType: data.resolutionType
    }
  });

  await invalidateCache(complaintsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/complaints");
  revalidatePath("/dashboard");
  return complaint;
}

// Close complaint (final step after resolution verified)
export async function closeComplaint(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const complaint = await prisma.complaint.update({
    where: { id, practiceId: practice.id },
    data: { status: "CLOSED" }
  });

  await invalidateCache(complaintsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/complaints");
  return complaint;
}

// Delete complaint
export async function deleteComplaint(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  await prisma.complaint.delete({
    where: { id, practiceId: practice.id }
  });

  await invalidateCache(complaintsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/complaints");
  revalidatePath("/dashboard");
}

// Add attachment to complaint
export async function addComplaintAttachment(id: string, attachmentUrl: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const complaint = await prisma.complaint.findFirst({
    where: { id, practiceId: practice.id },
    select: { attachments: true }
  });

  if (!complaint) throw new Error("Complaint not found");

  const updatedAttachments = [...(complaint.attachments || []), attachmentUrl];

  const updated = await prisma.complaint.update({
    where: { id, practiceId: practice.id },
    data: { attachments: updatedAttachments }
  });

  await invalidateCache(complaintsCacheKey(practice.id));

  revalidatePath("/complaints");
  return updated;
}

// Get complaints needing acknowledgement (overdue > 5 days)
export async function getOverdueAcknowledgements() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  return prisma.complaint.findMany({
    where: {
      practiceId: practice.id,
      status: "RECEIVED",
      dateReceived: { lt: fiveDaysAgo }
    },
    orderBy: { dateReceived: "asc" }
  });
}
