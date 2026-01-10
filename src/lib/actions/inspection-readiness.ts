"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { NON_NEGOTIABLES } from "@/lib/constants/non-negotiables";

export type NonNegotiableStatus = {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  status: "compliant" | "attention" | "non_compliant" | "unknown";
  score: number; // 0-100
  details: {
    documents: { name: string; status: "current" | "expiring" | "expired" | "missing" }[];
    notes?: string;
  };
};

// Default empty data for error fallback
const emptyInspectionData = {
  nonNegotiables: NON_NEGOTIABLES.map(nn => ({
    id: nn.id,
    title: nn.title,
    description: nn.description,
    category: nn.category,
    icon: nn.icon,
    status: "unknown" as const,
    score: 0,
    details: { documents: [], notes: "Unable to load data" },
  })),
  summary: {
    overallScore: 0,
    compliantCount: 0,
    attentionCount: 0,
    nonCompliantCount: 0,
    unknownCount: 12,
  },
};

export async function getInspectionReadinessData() {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return withDbConnection(async () => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get all documents with their types
      const [documents, documentTypes, complaints, adverseEvents, employees] = await Promise.all([
        prisma.document.findMany({
          where: { practiceId: practice.id },
          include: {
            DocumentType: true,
          },
        }),
        prisma.documentType.findMany(),
        prisma.complaint.findMany({
          where: { practiceId: practice.id },
          orderBy: { dateReceived: "desc" },
          take: 10,
        }),
        prisma.adverseEvent.findMany({
          where: { practiceId: practice.id },
          orderBy: { eventDate: "desc" },
          take: 10,
        }),
        prisma.employee.findMany({
          where: { practiceId: practice.id, isActive: true },
          include: {
            EmployeeTraining: {
              where: {
                OR: [
                  { expiryDate: null },
                  { expiryDate: { gte: now } },
                ],
              },
            },
            ProfessionalRegistration: {
              where: { isActive: true },
            },
          },
        }),
      ]);

      // Create a map of document type name to documents
      const documentsByType = new Map<string, typeof documents>();
      for (const doc of documents) {
        const typeName = doc.DocumentType.name;
        if (!documentsByType.has(typeName)) {
          documentsByType.set(typeName, []);
        }
        documentsByType.get(typeName)!.push(doc);
      }

      // Calculate status for each non-negotiable
      const nonNegotiableStatuses: NonNegotiableStatus[] = NON_NEGOTIABLES.map((nn) => {
        const documentDetails: NonNegotiableStatus["details"]["documents"] = [];
        let totalScore = 0;
        let checkedItems = 0;

        // Check document requirements
        if (nn.documentTypes) {
          for (const docTypeName of nn.documentTypes) {
            const docs = documentsByType.get(docTypeName) || [];
            const latestDoc = docs[0]; // Assuming sorted by createdAt desc

            if (!latestDoc) {
              documentDetails.push({ name: docTypeName, status: "missing" });
              checkedItems++;
            } else if (latestDoc.expiryDate && new Date(latestDoc.expiryDate) < now) {
              documentDetails.push({ name: docTypeName, status: "expired" });
              checkedItems++;
            } else if (latestDoc.expiryDate && new Date(latestDoc.expiryDate) < thirtyDaysFromNow) {
              documentDetails.push({ name: docTypeName, status: "expiring" });
              totalScore += 50;
              checkedItems++;
            } else {
              documentDetails.push({ name: docTypeName, status: "current" });
              totalScore += 100;
              checkedItems++;
            }
          }
        }

        // Additional checks based on checkType
        let notes: string | undefined;

        switch (nn.checkType) {
          case "complaints": {
            const openComplaints = complaints.filter(c => !["RESOLVED", "CLOSED"].includes(c.status));
            const overdueAck = complaints.filter(c => {
              if (c.acknowledgedAt) return false;
              const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
              return new Date(c.dateReceived) < fiveDaysAgo;
            });
            if (overdueAck.length > 0) {
              notes = `${overdueAck.length} complaint(s) not acknowledged within 5 days`;
              totalScore -= 20 * overdueAck.length;
            } else if (openComplaints.length > 0) {
              notes = `${openComplaints.length} open complaint(s)`;
            } else {
              notes = "All complaints properly managed";
              totalScore += 50;
              checkedItems++;
            }
            break;
          }
          case "adverse_events": {
            const openEvents = adverseEvents.filter(e => e.status !== "CLOSED");
            const severeUnreported = adverseEvents.filter(e => e.severity === "SEVERE" && !e.reportedToAuthority);
            if (severeUnreported.length > 0) {
              notes = `${severeUnreported.length} severe event(s) may need authority reporting`;
              totalScore -= 30 * severeUnreported.length;
            } else if (openEvents.length > 0) {
              notes = `${openEvents.length} open event(s) under investigation`;
            } else {
              notes = "Adverse events register up to date";
              totalScore += 50;
              checkedItems++;
            }
            break;
          }
          case "staff_registration": {
            const clinicalStaff = employees.filter(e =>
              ["Doctor", "Nurse", "Medical Assistant"].some(pos => e.position.includes(pos))
            );
            const withExpiredReg = clinicalStaff.filter(e => {
              const regs = e.ProfessionalRegistration;
              return regs.length === 0 || regs.some(r => r.expiryDate && new Date(r.expiryDate) < now);
            });
            if (withExpiredReg.length > 0) {
              notes = `${withExpiredReg.length} staff member(s) with expired/missing registration`;
              totalScore -= 30 * withExpiredReg.length;
            } else if (clinicalStaff.length > 0) {
              notes = "All clinical staff have valid registrations";
              totalScore += 100;
              checkedItems++;
            }
            break;
          }
          case "training": {
            const staffWithTraining = employees.filter(e => e.EmployeeTraining.length > 0);
            const percentTrained = employees.length > 0 ? (staffWithTraining.length / employees.length) * 100 : 0;
            notes = `${staffWithTraining.length}/${employees.length} staff have training records`;
            totalScore += percentTrained;
            checkedItems++;
            break;
          }
        }

        // Calculate final score
        const score = checkedItems > 0 ? Math.min(100, Math.max(0, Math.round(totalScore / checkedItems))) : 0;

        // Determine status based on score
        let status: NonNegotiableStatus["status"] = "unknown";
        if (score >= 80) {
          status = "compliant";
        } else if (score >= 50) {
          status = "attention";
        } else if (checkedItems > 0) {
          status = "non_compliant";
        }

        return {
          id: nn.id,
          title: nn.title,
          description: nn.description,
          category: nn.category,
          icon: nn.icon,
          status,
          score,
          details: {
            documents: documentDetails,
            notes,
          },
        };
      });

      // Calculate overall score
      const overallScore = Math.round(
        nonNegotiableStatuses.reduce((sum, nn) => sum + nn.score, 0) / nonNegotiableStatuses.length
      );

      const compliantCount = nonNegotiableStatuses.filter(nn => nn.status === "compliant").length;
      const attentionCount = nonNegotiableStatuses.filter(nn => nn.status === "attention").length;
      const nonCompliantCount = nonNegotiableStatuses.filter(nn => nn.status === "non_compliant").length;

      return {
        nonNegotiables: nonNegotiableStatuses,
        summary: {
          overallScore,
          compliantCount,
          attentionCount,
          nonCompliantCount,
          unknownCount: nonNegotiableStatuses.filter(nn => nn.status === "unknown").length,
        },
      };
    });
  } catch (error) {
    console.error("Inspection readiness data fetch error:", error);
    return emptyInspectionData;
  }
}
