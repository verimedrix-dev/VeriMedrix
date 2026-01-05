"use server";

import { prisma } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";
import { AdverseEventCategory, AdverseEventSeverity, PatientOutcome, EventStatus } from "@prisma/client";

// Cache key for adverse events
const adverseEventsCacheKey = (practiceId: string) => `practice:${practiceId}:adverse-events`;

// Generate reference number: AE-2025-001
async function generateReferenceNumber(practiceId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.adverseEvent.count({
    where: {
      practiceId,
      referenceNumber: { startsWith: `AE-${year}` }
    }
  });
  return `AE-${year}-${String(count + 1).padStart(3, "0")}`;
}

// Get all adverse events with stats
export async function getAdverseEventsPageData() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return getCachedData(
    adverseEventsCacheKey(practice.id),
    async () => {
      const [events, stats] = await Promise.all([
        prisma.adverseEvent.findMany({
          where: { practiceId: practice.id },
          orderBy: { eventDate: "desc" },
          take: 100,
        }),
        // Aggregated stats query
        prisma.$queryRaw<[{
          total: bigint;
          reported: bigint;
          investigating: bigint;
          action_taken: bigint;
          closed: bigint;
          severe: bigint;
          near_miss: bigint;
        }]>`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'REPORTED') as reported,
            COUNT(*) FILTER (WHERE status = 'INVESTIGATING') as investigating,
            COUNT(*) FILTER (WHERE status = 'ACTION_TAKEN') as action_taken,
            COUNT(*) FILTER (WHERE status = 'CLOSED') as closed,
            COUNT(*) FILTER (WHERE severity = 'SEVERE') as severe,
            COUNT(*) FILTER (WHERE severity = 'NEAR_MISS') as near_miss
          FROM "AdverseEvent"
          WHERE "practiceId" = ${practice.id}
        `
      ]);

      const s = stats[0];
      return {
        events,
        stats: {
          total: Number(s?.total || 0),
          reported: Number(s?.reported || 0),
          investigating: Number(s?.investigating || 0),
          actionTaken: Number(s?.action_taken || 0),
          closed: Number(s?.closed || 0),
          severe: Number(s?.severe || 0),
          nearMiss: Number(s?.near_miss || 0),
        }
      };
    },
    CACHE_DURATIONS.SHORT
  );
}

// Get single adverse event by ID
export async function getAdverseEvent(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return prisma.adverseEvent.findFirst({
    where: { id, practiceId: practice.id }
  });
}

// Create a new adverse event
export async function createAdverseEvent(data: {
  eventDate: Date;
  patientInitials?: string;
  patientFileNumber?: string;
  category: AdverseEventCategory;
  severity: AdverseEventSeverity;
  description: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const referenceNumber = await generateReferenceNumber(practice.id);

  const event = await prisma.adverseEvent.create({
    data: {
      practiceId: practice.id,
      referenceNumber,
      eventDate: data.eventDate,
      patientInitials: data.patientInitials,
      patientFileNumber: data.patientFileNumber,
      category: data.category,
      severity: data.severity,
      description: data.description,
      status: "REPORTED",
      createdBy: user.id,
    }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/adverse-events");
  revalidatePath("/dashboard");
  return event;
}

// Update adverse event
export async function updateAdverseEvent(id: string, data: {
  patientInitials?: string;
  patientFileNumber?: string;
  category?: AdverseEventCategory;
  severity?: AdverseEventSeverity;
  description?: string;
  status?: EventStatus;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/adverse-events");
  revalidatePath("/dashboard");
  return event;
}

// Start investigation
export async function startEventInvestigation(id: string, investigatedBy: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "INVESTIGATING",
      investigatedBy,
      investigationDate: new Date()
    }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));

  revalidatePath("/adverse-events");
  return event;
}

// Record investigation findings
export async function recordEventFindings(id: string, data: {
  findings: string;
  rootCause?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data: {
      findings: data.findings,
      rootCause: data.rootCause
    }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));

  revalidatePath("/adverse-events");
  return event;
}

// Record corrective action
export async function recordCorrectiveAction(id: string, data: {
  correctiveAction: string;
  preventionPlan?: string;
  actionVerifiedBy?: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data: {
      status: "ACTION_TAKEN",
      correctiveAction: data.correctiveAction,
      preventionPlan: data.preventionPlan,
      actionImplementedDate: new Date(),
      actionVerifiedBy: data.actionVerifiedBy || user.name || user.email,
    }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/adverse-events");
  revalidatePath("/dashboard");
  return event;
}

// Record patient outcome
export async function recordPatientOutcome(id: string, outcome: PatientOutcome) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data: { patientOutcome: outcome }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));

  revalidatePath("/adverse-events");
  return event;
}

// Report to authority (if required)
export async function reportToAuthority(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data: {
      reportedToAuthority: true,
      authorityReportDate: new Date()
    }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));

  revalidatePath("/adverse-events");
  return event;
}

// Close event
export async function closeAdverseEvent(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data: { status: "CLOSED" }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/adverse-events");
  return event;
}

// Delete adverse event
export async function deleteAdverseEvent(id: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  await prisma.adverseEvent.delete({
    where: { id, practiceId: practice.id }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));
  await invalidateCache(cacheKeys.practiceDashboard(practice.id));

  revalidatePath("/adverse-events");
  revalidatePath("/dashboard");
}

// Add attachment
export async function addEventAttachment(id: string, attachmentUrl: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Not authenticated");

  const event = await prisma.adverseEvent.findFirst({
    where: { id, practiceId: practice.id },
    select: { attachments: true }
  });

  if (!event) throw new Error("Event not found");

  const updatedAttachments = [...(event.attachments || []), attachmentUrl];

  const updated = await prisma.adverseEvent.update({
    where: { id, practiceId: practice.id },
    data: { attachments: updatedAttachments }
  });

  await invalidateCache(adverseEventsCacheKey(practice.id));

  revalidatePath("/adverse-events");
  return updated;
}

// Get severe events for reporting
export async function getSevereEvents() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return prisma.adverseEvent.findMany({
    where: {
      practiceId: practice.id,
      severity: "SEVERE",
      reportedToAuthority: false
    },
    orderBy: { eventDate: "desc" }
  });
}
