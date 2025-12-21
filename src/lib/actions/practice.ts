"use server";

import { getAuthUser } from "@/lib/supabase/server";
import { prisma, withDbConnection } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { sendWelcomeEmail } from "@/lib/email";

// Cache the DB user lookup for the duration of the request
export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  return withDbConnection(() =>
    prisma.user.findUnique({
      where: { email: authUser.email! },
      include: { Practice: true }
    })
  );
});

// Cache the practice lookup
export const getCurrentPractice = cache(async () => {
  const user = await getCurrentUser();
  return user?.Practice || null;
});

// Optimized: Single query path for existing users (99% of requests)
export const ensureUserAndPractice = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/sign-in");
  }

  // Fast path - direct query with connection retry
  let dbUser = await withDbConnection(() =>
    prisma.user.findUnique({
      where: { email: authUser.email! },
      include: { Practice: true }
    })
  );

  if (dbUser) {
    return { user: dbUser, practice: dbUser.Practice };
  }

  // Slow path: New user creation (rare)
  try {
    const result = await withDbConnection(() =>
      prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { email: authUser.email! },
          include: { Practice: true }
        });

        if (existingUser) {
          return { user: existingUser, practice: existingUser.Practice };
        }

        const practice = await tx.practice.create({
          data: {
            id: createId(),
            name: "My Practice",
            email: authUser.email!,
            updatedAt: new Date()
          }
        });

        const newUser = await tx.user.create({
          data: {
            id: createId(),
            email: authUser.email!,
            name: authUser.email!.split("@")[0],
            practiceId: practice.id,
            role: "PRACTICE_OWNER",
            updatedAt: new Date(),
          },
          include: { Practice: true }
        });

        return { user: newUser, practice: newUser.Practice, isNewUser: true };
      })
    );

    // Send welcome email to new users (don't await to avoid blocking)
    if (result.isNewUser && result.user.email) {
      sendWelcomeEmail(
        result.user.email,
        result.user.name || result.user.email.split("@")[0],
        result.practice?.name
      ).catch((err) => console.error("Failed to send welcome email:", err));
    }

    return result;
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      dbUser = await withDbConnection(() =>
        prisma.user.findUnique({
          where: { email: authUser.email! },
          include: { Practice: true }
        })
      );
      if (dbUser) {
        return { user: dbUser, practice: dbUser.Practice };
      }
    }
    throw error;
  }
});

// ==================== PRACTICE SETTINGS ====================

export async function getPracticeSettings() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return prisma.practice.findUnique({
    where: { id: practice.id },
    select: {
      id: true,
      name: true,
      practiceNumber: true,
      address: true,
      phone: true,
      email: true,
    },
  });
}

export async function updatePracticeSettings(data: {
  name?: string;
  practiceNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Practice not found");

  await prisma.practice.update({
    where: { id: practice.id },
    data,
  });

  revalidatePath("/settings");
}

// ==================== PRACTICE DOCUMENTS ====================

export async function getPracticeDocuments() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return prisma.practiceDocument.findMany({
    where: { practiceId: practice.id },
    include: { User: { select: { name: true, email: true } } },
    orderBy: { uploadedAt: "desc" },
  });
}

export async function uploadPracticeDocument(data: {
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}) {
  const { user, practice } = await ensureUserAndPractice();
  if (!practice || !user) throw new Error("Unauthorized");

  const doc = await prisma.practiceDocument.create({
    data: {
      practiceId: practice.id,
      uploadedBy: user.id,
      ...data,
    },
  });

  revalidatePath("/settings");
  return doc;
}

export async function deletePracticeDocument(documentId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const doc = await prisma.practiceDocument.findFirst({
    where: { id: documentId, practiceId: practice.id },
  });

  if (!doc) throw new Error("Document not found");

  await prisma.practiceDocument.delete({ where: { id: documentId } });
  revalidatePath("/settings");
}

export async function updatePracticeDocumentName(documentId: string, name: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const doc = await prisma.practiceDocument.findFirst({
    where: { id: documentId, practiceId: practice.id },
  });

  if (!doc) throw new Error("Document not found");

  await prisma.practiceDocument.update({ where: { id: documentId }, data: { name } });
  revalidatePath("/settings");
}

// ==================== SUBSCRIPTION ====================

export async function getSubscriptionInfo() {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return null;

  return prisma.practice.findUnique({
    where: { id: practice.id },
    select: {
      id: true,
      subscriptionTier: true,
    },
  });
}

export async function updateSubscriptionTier(tier: "ESSENTIALS" | "PROFESSIONAL") {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Practice not found");

  await prisma.practice.update({
    where: { id: practice.id },
    data: {
      subscriptionTier: tier,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}
