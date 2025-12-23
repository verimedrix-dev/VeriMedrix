"use server";

import { ensureUserAndPractice } from "./practice";
import { getPracticeYTD as getYTD } from "@/lib/payroll-compliance";

export async function getPracticeYTD(taxYear: string) {
  const { practice } = await ensureUserAndPractice();
  if (!practice) return [];

  return await getYTD(practice.id, taxYear);
}
