"use server";

import { prisma, withDbConnection } from "@/lib/prisma";
import { ensureUserAndPractice } from "./practice";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { createId } from "@paralleldrive/cuid2";

// Field types for custom forms
export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "radio"
  | "dropdown"
  | "date"
  | "time"
  | "datetime"
  | "signature";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // For radio, dropdown
  min?: number; // For number
  max?: number; // For number
  order: number;
}

export type FormSchedule = "DAILY" | "WEEKLY" | "MONTHLY" | null;

// =============================================================================
// FORM TEMPLATES CRUD
// =============================================================================

/**
 * Get all custom forms for the practice
 */
export const getCustomForms = cache(async () => {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return [];

    return await withDbConnection(() =>
      prisma.customForm.findMany({
        where: { practiceId: practice.id },
        orderBy: { createdAt: "desc" },
        include: {
          CreatedBy: {
            select: { name: true },
          },
          _count: {
            select: { Responses: true },
          },
        },
      })
    );
  } catch (error) {
    console.error("Error fetching custom forms:", error);
    return [];
  }
});

/**
 * Get a single custom form by ID
 */
export const getCustomForm = cache(async (formId: string) => {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return await withDbConnection(() =>
      prisma.customForm.findFirst({
        where: {
          id: formId,
          practiceId: practice.id,
        },
        include: {
          CreatedBy: {
            select: { name: true },
          },
        },
      })
    );
  } catch (error) {
    console.error("Error fetching custom form:", error);
    return null;
  }
});

/**
 * Create a new custom form
 */
export async function createCustomForm(data: {
  name: string;
  description?: string;
  fields: FormField[];
  schedule?: FormSchedule;
}): Promise<{ success: boolean; formId?: string; error?: string }> {
  try {
    const { user, practice } = await ensureUserAndPractice();
    if (!practice || !user) {
      return { success: false, error: "Not authenticated" };
    }

    const form = await withDbConnection(() =>
      prisma.customForm.create({
        data: {
          id: createId(),
          practiceId: practice.id,
          name: data.name,
          description: data.description,
          fields: data.fields as unknown as object,
          schedule: data.schedule,
          createdById: user.id,
        },
      })
    );

    revalidatePath("/forms");
    return { success: true, formId: form.id };
  } catch (error) {
    console.error("Error creating custom form:", error);
    return { success: false, error: "Failed to create form" };
  }
}

/**
 * Update an existing custom form
 */
export async function updateCustomForm(
  formId: string,
  data: {
    name?: string;
    description?: string;
    fields?: FormField[];
    schedule?: FormSchedule;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) {
      return { success: false, error: "Not authenticated" };
    }

    const existing = await withDbConnection(() =>
      prisma.customForm.findFirst({
        where: { id: formId, practiceId: practice.id },
      })
    );

    if (!existing) {
      return { success: false, error: "Form not found" };
    }

    await withDbConnection(() =>
      prisma.customForm.update({
        where: { id: formId },
        data: {
          name: data.name,
          description: data.description,
          fields: data.fields as unknown as object | undefined,
          schedule: data.schedule,
          isActive: data.isActive,
        },
      })
    );

    revalidatePath("/forms");
    revalidatePath(`/forms/${formId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating custom form:", error);
    return { success: false, error: "Failed to update form" };
  }
}

/**
 * Delete a custom form
 */
export async function deleteCustomForm(formId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) {
      return { success: false, error: "Not authenticated" };
    }

    const existing = await withDbConnection(() =>
      prisma.customForm.findFirst({
        where: { id: formId, practiceId: practice.id },
      })
    );

    if (!existing) {
      return { success: false, error: "Form not found" };
    }

    await withDbConnection(() =>
      prisma.customForm.delete({
        where: { id: formId },
      })
    );

    revalidatePath("/forms");
    return { success: true };
  } catch (error) {
    console.error("Error deleting custom form:", error);
    return { success: false, error: "Failed to delete form" };
  }
}

// =============================================================================
// FORM RESPONSES
// =============================================================================

/**
 * Submit a form response
 */
export async function submitFormResponse(
  formId: string,
  responses: Record<string, string | number | boolean | string[]>
): Promise<{ success: boolean; responseId?: string; error?: string }> {
  try {
    const { user, practice } = await ensureUserAndPractice();
    if (!practice || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify form exists and is active
    const form = await withDbConnection(() =>
      prisma.customForm.findFirst({
        where: { id: formId, practiceId: practice.id, isActive: true },
      })
    );

    if (!form) {
      return { success: false, error: "Form not found or inactive" };
    }

    const response = await withDbConnection(() =>
      prisma.customFormResponse.create({
        data: {
          id: createId(),
          formId,
          practiceId: practice.id,
          responses: responses as unknown as object,
          submittedById: user.id,
        },
      })
    );

    revalidatePath(`/forms/${formId}`);
    revalidatePath(`/forms/${formId}/responses`);
    return { success: true, responseId: response.id };
  } catch (error) {
    console.error("Error submitting form response:", error);
    return { success: false, error: "Failed to submit form" };
  }
}

/**
 * Get form responses for a specific form
 */
export const getFormResponses = cache(async (formId: string, limit = 50, offset = 0) => {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return { responses: [], total: 0 };

    const [responses, total] = await Promise.all([
      withDbConnection(() =>
        prisma.customFormResponse.findMany({
          where: { formId, practiceId: practice.id },
          orderBy: { submittedAt: "desc" },
          take: limit,
          skip: offset,
          include: {
            SubmittedBy: {
              select: { name: true },
            },
          },
        })
      ),
      withDbConnection(() =>
        prisma.customFormResponse.count({
          where: { formId, practiceId: practice.id },
        })
      ),
    ]);

    return { responses, total };
  } catch (error) {
    console.error("Error fetching form responses:", error);
    return { responses: [], total: 0 };
  }
});

/**
 * Get a single form response by ID
 */
export const getFormResponse = cache(async (responseId: string) => {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return null;

    return await withDbConnection(() =>
      prisma.customFormResponse.findFirst({
        where: {
          id: responseId,
          practiceId: practice.id,
        },
        include: {
          SubmittedBy: {
            select: { name: true },
          },
          Form: {
            select: { name: true, fields: true },
          },
        },
      })
    );
  } catch (error) {
    console.error("Error fetching form response:", error);
    return null;
  }
});

/**
 * Delete a form response
 */
export async function deleteFormResponse(responseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) {
      return { success: false, error: "Not authenticated" };
    }

    const existing = await withDbConnection(() =>
      prisma.customFormResponse.findFirst({
        where: { id: responseId, practiceId: practice.id },
      })
    );

    if (!existing) {
      return { success: false, error: "Response not found" };
    }

    await withDbConnection(() =>
      prisma.customFormResponse.delete({
        where: { id: responseId },
      })
    );

    revalidatePath(`/forms/${existing.formId}`);
    revalidatePath(`/forms/${existing.formId}/responses`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting form response:", error);
    return { success: false, error: "Failed to delete response" };
  }
}

/**
 * Get forms due today based on schedule
 */
export const getFormsDueToday = cache(async () => {
  try {
    const { practice } = await ensureUserAndPractice();
    if (!practice) return [];

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const dayOfMonth = today.getDate();

    const forms = await withDbConnection(() =>
      prisma.customForm.findMany({
        where: {
          practiceId: practice.id,
          isActive: true,
          schedule: { not: null },
        },
        include: {
          Responses: {
            where: {
              submittedAt: {
                gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              },
            },
            select: { id: true },
          },
        },
      })
    );

    // Filter forms based on schedule
    return forms.filter(form => {
      // Already submitted today
      if (form.Responses.length > 0) return false;

      switch (form.schedule) {
        case "DAILY":
          return true;
        case "WEEKLY":
          return dayOfWeek === 1; // Monday
        case "MONTHLY":
          return dayOfMonth === 1; // First of month
        default:
          return false;
      }
    });
  } catch (error) {
    console.error("Error fetching forms due today:", error);
    return [];
  }
});
