"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureUserAndPractice } from "./practice";
import type { BenefitType } from "@prisma/client";

export async function getEmployeeFringeBenefits(employeeId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, practiceId: practice.id },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  return await prisma.employeeFringeBenefit.findMany({
    where: { employeeId },
    orderBy: { effectiveFrom: "desc" },
  });
}

export async function addEmployeeFringeBenefit(data: {
  employeeId: string;
  benefitType: BenefitType;
  description?: string;
  monthlyTaxableValue: number;
  effectiveFrom: Date;
}) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify employee belongs to practice
  const employee = await prisma.employee.findFirst({
    where: { id: data.employeeId, practiceId: practice.id },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  await prisma.employeeFringeBenefit.create({
    data: {
      employeeId: data.employeeId,
      benefitType: data.benefitType,
      description: data.description,
      monthlyTaxableValue: data.monthlyTaxableValue,
      effectiveFrom: data.effectiveFrom,
    },
  });

  revalidatePath("/payroll");
}

export async function removeEmployeeFringeBenefit(benefitId: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) throw new Error("Unauthorized");

  // Verify benefit belongs to employee in practice
  const benefit = await prisma.employeeFringeBenefit.findUnique({
    where: { id: benefitId },
    include: {
      Employee: {
        select: { practiceId: true },
      },
    },
  });

  if (!benefit || benefit.Employee.practiceId !== practice.id) {
    throw new Error("Fringe benefit not found");
  }

  // Soft delete by setting effectiveTo to now
  await prisma.employeeFringeBenefit.update({
    where: { id: benefitId },
    data: { effectiveTo: new Date() },
  });

  revalidatePath("/payroll");
}
