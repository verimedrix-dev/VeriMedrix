"use server";

import { prisma } from "@/lib/prisma";

/**
 * Check if an email already exists in our database
 * This helps provide better UX for duplicate signups
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean; isEmployee: boolean }> {
  // Check if user exists in our User table
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return { exists: true, isEmployee: false };
  }

  // Check if email exists as an employee (they may need to accept an invitation)
  const existingEmployee = await prisma.employee.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      userId: null, // Not yet linked to a user account
    },
  });

  if (existingEmployee) {
    return { exists: false, isEmployee: true };
  }

  return { exists: false, isEmployee: false };
}
