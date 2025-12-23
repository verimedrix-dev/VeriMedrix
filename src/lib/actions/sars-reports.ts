"use server";

import { ensureUserAndPractice } from "./practice";
import { generateEMP201, generateEMP501, generateIRP5, exportEMP201CSV, exportEMP501CSV } from "@/lib/sars-reports";

export async function downloadEMP201Report(month: number, year: number): Promise<string> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const report = await generateEMP201(practice.id, month, year);
  return exportEMP201CSV(report);
}

export async function downloadEMP501Report(taxYear: string): Promise<string> {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  const report = await generateEMP501(practice.id, taxYear);
  return exportEMP501CSV(report);
}

export async function downloadIRP5Certificate(employeeId: string, taxYear: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify employee belongs to practice
  const { prisma } = await import("@/lib/prisma");
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const certificate = await generateIRP5(employeeId, taxYear);
  return certificate;
}
