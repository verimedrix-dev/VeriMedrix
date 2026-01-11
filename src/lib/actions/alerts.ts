"use server";

import { prisma } from "@/lib/prisma";
import { AlertType, AlertChannel } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { getCachedData, cacheKeys, CACHE_DURATIONS, invalidateCache } from "@/lib/redis";

/**
 * Create an in-app notification/alert for a user
 */
export async function createAlert({
  practiceId,
  recipientId,
  alertType,
  message,
  relatedDocumentId,
  relatedTaskId,
  channel = "EMAIL",
  scheduledFor,
}: {
  practiceId: string;
  recipientId: string;
  alertType: AlertType;
  message: string;
  relatedDocumentId?: string;
  relatedTaskId?: string;
  channel?: AlertChannel;
  scheduledFor?: Date;
}) {
  const alert = await prisma.alert.create({
    data: {
      id: createId(),
      practiceId,
      recipientId,
      alertType,
      message,
      relatedDocumentId,
      relatedTaskId,
      channel,
      scheduledFor: scheduledFor || new Date(),
      status: "PENDING",
    },
  });

  // Invalidate cache
  await invalidateCache(cacheKeys.practiceAlerts(practiceId));

  revalidatePath("/notifications");
  return alert;
}

/**
 * Create notifications for all practice owners/admins
 */
export async function notifyPracticeOwners({
  practiceId,
  alertType,
  message,
  relatedDocumentId,
  relatedTaskId,
}: {
  practiceId: string;
  alertType: AlertType;
  message: string;
  relatedDocumentId?: string;
  relatedTaskId?: string;
}) {
  // Find all practice owners and admins
  const owners = await prisma.user.findMany({
    where: {
      practiceId,
      isActive: true,
      role: { in: ["PRACTICE_OWNER", "ADMIN"] },
    },
    select: { id: true },
  });

  // Create alerts for each owner/admin
  const alerts = await Promise.all(
    owners.map((owner) =>
      createAlert({
        practiceId,
        recipientId: owner.id,
        alertType,
        message,
        relatedDocumentId,
        relatedTaskId,
      })
    )
  );

  return alerts;
}

/**
 * Mark an alert as read/sent
 */
export async function markAlertAsSent(alertId: string) {
  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  revalidatePath("/notifications");
}

/**
 * Mark all alerts as read for a user
 */
export async function markAllAlertsAsRead(userId: string) {
  await prisma.alert.updateMany({
    where: {
      recipientId: userId,
      status: "PENDING",
    },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  revalidatePath("/notifications");
  return { success: true };
}

/**
 * Get unread alert count for a user
 */
export async function getUnreadAlertCount(userId: string) {
  try {
    const { withDbConnection } = await import("@/lib/prisma");
    const count = await withDbConnection(() =>
      prisma.alert.count({
        where: {
          recipientId: userId,
          status: "PENDING",
        },
      })
    );
    return count;
  } catch (error) {
    console.error("getUnreadAlertCount error:", error);
    return 0;
  }
}

/**
 * Delete old alerts (cleanup function)
 */
export async function cleanupOldAlerts(daysOld: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const deleted = await prisma.alert.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      status: "SENT",
    },
  });

  return deleted.count;
}
