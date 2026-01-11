"use server";

import { prisma } from "@/lib/prisma";

/**
 * Check if an email already exists in our database
 * This helps provide better UX for duplicate signups
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean; isEmployee: boolean; hasUsedTrial: boolean }> {
  const normalizedEmail = email.toLowerCase();

  // Check if user exists in our User table
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return { exists: true, isEmployee: false, hasUsedTrial: false };
  }

  // Check if email exists as an employee (they may need to accept an invitation)
  const existingEmployee = await prisma.employee.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      userId: null, // Not yet linked to a user account
    },
  });

  if (existingEmployee) {
    return { exists: false, isEmployee: true, hasUsedTrial: false };
  }

  // Check if this email has already used a free trial
  const usedTrial = await prisma.usedTrialEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (usedTrial) {
    return { exists: false, isEmployee: false, hasUsedTrial: true };
  }

  return { exists: false, isEmployee: false, hasUsedTrial: false };
}

/**
 * Record that an email has used a free trial
 * This should be called after successful signup
 */
export async function recordTrialUsage(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();

  await prisma.usedTrialEmail.upsert({
    where: { email: normalizedEmail },
    update: {}, // No update needed, just ensure it exists
    create: { email: normalizedEmail },
  });
}
