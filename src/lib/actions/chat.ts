"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { getAuthUser } from "@/lib/supabase/server";
import { differenceInDays, format } from "date-fns";

export type PracticeContext = {
  practice: {
    name: string;
    practiceNumber: string | null;
    address: string | null;
    email: string;
  };
  complianceScore: number;
  documents: {
    total: number;
    valid: number;
    expiringSoon: number;
    expired: number;
    missing: number;
    list: Array<{
      name: string;
      type: string;
      status: string;
      expiryDate: string | null;
      daysUntilExpiry: number | null;
    }>;
  };
  employees: {
    total: number;
    list: Array<{
      name: string;
      position: string;
      certifications: Array<{
        name: string;
        expiryDate: string | null;
        status: string;
      }>;
    }>;
  };
  tasks: {
    total: number;
    overdue: number;
    pending: number;
  };
  requiredDocuments: Array<{
    name: string;
    category: string;
    isRequired: boolean;
    hasDocument: boolean;
  }>;
};

export async function getPracticeContext(): Promise<PracticeContext | null> {
  // Get auth user without redirecting (for API route usage)
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  // Find user and practice in database
  const dbUser = await withDbConnection(() =>
    prisma.user.findUnique({
      where: { email: authUser.email! },
      include: { Practice: true },
    })
  );

  if (!dbUser?.Practice) return null;
  const practice = dbUser.Practice;

  const today = new Date();

  // Fetch all data in parallel
  const [practiceData, documents, employees, tasks, documentTypes] = await Promise.all([
    withDbConnection(() =>
      prisma.practice.findUnique({
        where: { id: practice.id },
        select: {
          name: true,
          practiceNumber: true,
          address: true,
          email: true,
        },
      })
    ),
    withDbConnection(() =>
      prisma.document.findMany({
        where: { practiceId: practice.id },
        include: {
          DocumentType: {
            select: { name: true, DocumentCategory: { select: { name: true } } },
          },
        },
      })
    ),
    withDbConnection(() =>
      prisma.employee.findMany({
        where: { practiceId: practice.id, isActive: true },
        select: {
          fullName: true,
          position: true,
          hpcsaExpiry: true,
          sancExpiry: true,
          blsExpiry: true,
          sapcExpiry: true,
          ProfessionalRegistration: {
            select: {
              professionalBody: true,
              expiryDate: true,
            },
          },
        },
      })
    ),
    withDbConnection(() =>
      prisma.task.findMany({
        where: { practiceId: practice.id },
        select: {
          status: true,
          dueDate: true,
        },
      })
    ),
    withDbConnection(() =>
      prisma.documentType.findMany({
        include: {
          DocumentCategory: { select: { name: true } },
        },
      })
    ),
  ]);

  if (!practiceData) return null;

  // Process documents
  const documentStats = {
    total: documents.length,
    valid: 0,
    expiringSoon: 0,
    expired: 0,
    missing: 0,
    list: [] as PracticeContext["documents"]["list"],
  };

  for (const doc of documents) {
    let status = "VALID";
    let daysUntilExpiry: number | null = null;

    if (doc.expiryDate) {
      daysUntilExpiry = differenceInDays(new Date(doc.expiryDate), today);
      if (daysUntilExpiry < 0) {
        status = "EXPIRED";
        documentStats.expired++;
      } else if (daysUntilExpiry <= 30) {
        status = "EXPIRING_SOON";
        documentStats.expiringSoon++;
      } else {
        documentStats.valid++;
      }
    } else {
      documentStats.valid++;
    }

    documentStats.list.push({
      name: doc.title,
      type: doc.DocumentType?.name || "Unknown",
      status,
      expiryDate: doc.expiryDate ? format(new Date(doc.expiryDate), "yyyy-MM-dd") : null,
      daysUntilExpiry,
    });
  }

  // Check for missing required documents
  const uploadedDocTypeIds = new Set(documents.map((d) => d.documentTypeId));
  const requiredDocs = documentTypes.filter((dt) => dt.isRequired);
  const missingDocs = requiredDocs.filter((dt) => !uploadedDocTypeIds.has(dt.id));
  documentStats.missing = missingDocs.length;

  // Process employees with certifications
  const employeeList = employees.map((emp) => {
    const certifications: Array<{ name: string; expiryDate: string | null; status: string }> = [];

    // Add built-in registration expiry dates
    const builtInCerts = [
      { name: "HPCSA Registration", expiryDate: emp.hpcsaExpiry },
      { name: "SANC Registration", expiryDate: emp.sancExpiry },
      { name: "BLS Certification", expiryDate: emp.blsExpiry },
      { name: "SAPC Registration", expiryDate: emp.sapcExpiry },
    ];

    for (const cert of builtInCerts) {
      if (cert.expiryDate) {
        let status = "VALID";
        const daysUntil = differenceInDays(new Date(cert.expiryDate), today);
        if (daysUntil < 0) status = "EXPIRED";
        else if (daysUntil <= 30) status = "EXPIRING_SOON";
        certifications.push({
          name: cert.name,
          expiryDate: format(new Date(cert.expiryDate), "yyyy-MM-dd"),
          status,
        });
      }
    }

    // Add professional registrations
    for (const reg of emp.ProfessionalRegistration) {
      let status = "VALID";
      if (reg.expiryDate) {
        const daysUntil = differenceInDays(new Date(reg.expiryDate), today);
        if (daysUntil < 0) status = "EXPIRED";
        else if (daysUntil <= 30) status = "EXPIRING_SOON";
      }
      certifications.push({
        name: reg.professionalBody,
        expiryDate: reg.expiryDate ? format(new Date(reg.expiryDate), "yyyy-MM-dd") : null,
        status,
      });
    }

    return {
      name: emp.fullName,
      position: emp.position,
      certifications,
    };
  });

  // Process tasks
  const taskStats = {
    total: tasks.length,
    overdue: tasks.filter((t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < today).length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
  };

  // Calculate compliance score
  const totalRequired = requiredDocs.length;
  const validRequired = requiredDocs.filter((dt) => {
    const doc = documents.find((d) => d.documentTypeId === dt.id);
    if (!doc) return false;
    if (!doc.expiryDate) return true;
    return differenceInDays(new Date(doc.expiryDate), today) >= 0;
  }).length;
  const complianceScore = totalRequired > 0 ? Math.round((validRequired / totalRequired) * 100) : 100;

  // Build required documents list
  const requiredDocumentsList = documentTypes.map((dt) => ({
    name: dt.name,
    category: dt.DocumentCategory?.name || "Uncategorized",
    isRequired: dt.isRequired,
    hasDocument: uploadedDocTypeIds.has(dt.id),
  }));

  return {
    practice: practiceData,
    complianceScore,
    documents: documentStats,
    employees: {
      total: employees.length,
      list: employeeList,
    },
    tasks: taskStats,
    requiredDocuments: requiredDocumentsList,
  };
}
