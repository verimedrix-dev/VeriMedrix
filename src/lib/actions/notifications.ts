"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Get current user from database
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findFirst({
    where: { email: user.email },
  });

  return dbUser;
}

export type NotificationPreferences = {
  notifyExpiry90Days: boolean;
  notifyExpiry60Days: boolean;
  notifyExpiry30Days: boolean;
  notifyExpiryCritical: boolean;
  notifyTaskAssignment: boolean;
  notifyTaskOverdue: boolean;
  notifyWeeklyDigest: boolean;
};

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const user = await getCurrentUser();

  if (!user) return null;

  return {
    notifyExpiry90Days: user.notifyExpiry90Days,
    notifyExpiry60Days: user.notifyExpiry60Days,
    notifyExpiry30Days: user.notifyExpiry30Days,
    notifyExpiryCritical: user.notifyExpiryCritical,
    notifyTaskAssignment: user.notifyTaskAssignment,
    notifyTaskOverdue: user.notifyTaskOverdue,
    notifyWeeklyDigest: user.notifyWeeklyDigest,
  };
}

/**
 * Update a single notification preference
 */
export async function updateNotificationPreference(
  key: keyof NotificationPreferences,
  value: boolean
) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate the key is a valid notification preference
  const validKeys: (keyof NotificationPreferences)[] = [
    "notifyExpiry90Days",
    "notifyExpiry60Days",
    "notifyExpiry30Days",
    "notifyExpiryCritical",
    "notifyTaskAssignment",
    "notifyTaskOverdue",
    "notifyWeeklyDigest",
  ];

  if (!validKeys.includes(key)) {
    return { success: false, error: "Invalid preference key" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        [key]: value,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update notification preference:", error);
    return { success: false, error: "Failed to update preference" };
  }
}

/**
 * Update all notification preferences at once
 */
export async function updateAllNotificationPreferences(
  preferences: Partial<NotificationPreferences>
) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...preferences,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}
