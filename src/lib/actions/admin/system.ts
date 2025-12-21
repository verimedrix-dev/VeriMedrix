"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, logAdminAction } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { AnnouncementType, SubscriptionTier } from "@prisma/client";

// ============= SYSTEM CONFIG =============

export const getSystemConfigs = cache(async (category?: string) => {
  await requireSuperAdmin();

  return prisma.systemConfig.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
});

export async function updateSystemConfig(key: string, value: string, description?: string) {
  const admin = await requireSuperAdmin();

  const config = await prisma.systemConfig.upsert({
    where: { key },
    update: { value, description, updatedBy: admin.id },
    create: { key, value, description, updatedBy: admin.id },
  });

  await logAdminAction(admin.id, "UPDATE_CONFIG", "SystemConfig", key, undefined, { value });

  revalidatePath("/admin/settings");

  return config;
}

// ============= FEATURE FLAGS =============

export const getFeatureFlags = cache(async () => {
  await requireSuperAdmin();

  return prisma.featureFlag.findMany({
    include: {
      Overrides: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { Overrides: true },
      },
    },
    orderBy: { name: "asc" },
  });
});

export async function updateFeatureFlag(id: string, data: { isEnabled?: boolean; enabledForAll?: boolean; description?: string }) {
  const admin = await requireSuperAdmin();

  const flag = await prisma.featureFlag.update({
    where: { id },
    data,
  });

  await logAdminAction(admin.id, "UPDATE_FEATURE_FLAG", "FeatureFlag", id, undefined, data);

  revalidatePath("/admin/settings");

  return flag;
}

export async function createFeatureFlag(name: string, description?: string) {
  const admin = await requireSuperAdmin();

  const flag = await prisma.featureFlag.create({
    data: { name, description },
  });

  await logAdminAction(admin.id, "UPDATE_FEATURE_FLAG", "FeatureFlag", flag.id, undefined, { action: "create", name });

  revalidatePath("/admin/settings");

  return flag;
}

export async function setFeatureFlagOverride(
  featureFlagId: string,
  practiceId: string,
  isEnabled: boolean,
  reason?: string,
  expiresAt?: Date
) {
  const admin = await requireSuperAdmin();

  const override = await prisma.featureFlagOverride.upsert({
    where: {
      featureFlagId_practiceId: { featureFlagId, practiceId },
    },
    update: { isEnabled, reason, expiresAt },
    create: { featureFlagId, practiceId, isEnabled, reason, expiresAt },
  });

  await logAdminAction(admin.id, "UPDATE_FEATURE_FLAG", "FeatureFlagOverride", override.id, practiceId, {
    featureFlagId,
    isEnabled,
  });

  revalidatePath("/admin/settings");
  revalidatePath(`/admin/practices/${practiceId}`);

  return override;
}

// ============= ANNOUNCEMENTS =============

export const getAnnouncements = cache(async (includeInactive: boolean = false) => {
  await requireSuperAdmin();

  return prisma.systemAnnouncement.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { createdAt: "desc" },
  });
});

export async function createAnnouncement(data: {
  title: string;
  message: string;
  type?: AnnouncementType;
  showFrom?: Date;
  showUntil?: Date;
  targetTiers?: SubscriptionTier[];
}) {
  const admin = await requireSuperAdmin();

  const announcement = await prisma.systemAnnouncement.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type || "INFO",
      showFrom: data.showFrom || new Date(),
      showUntil: data.showUntil,
      targetTiers: data.targetTiers || [],
      createdById: admin.id,
    },
  });

  await logAdminAction(admin.id, "CREATE_ANNOUNCEMENT", "SystemAnnouncement", announcement.id);

  revalidatePath("/admin/announcements");

  return announcement;
}

export async function updateAnnouncement(id: string, data: {
  title?: string;
  message?: string;
  type?: AnnouncementType;
  isActive?: boolean;
  showFrom?: Date;
  showUntil?: Date;
  targetTiers?: SubscriptionTier[];
}) {
  const admin = await requireSuperAdmin();

  const announcement = await prisma.systemAnnouncement.update({
    where: { id },
    data,
  });

  await logAdminAction(admin.id, "CREATE_ANNOUNCEMENT", "SystemAnnouncement", id, undefined, { action: "update" });

  revalidatePath("/admin/announcements");

  return announcement;
}

export async function deleteAnnouncement(id: string) {
  const admin = await requireSuperAdmin();

  await prisma.systemAnnouncement.delete({ where: { id } });

  await logAdminAction(admin.id, "DELETE_ANNOUNCEMENT", "SystemAnnouncement", id);

  revalidatePath("/admin/announcements");
}

// ============= EMAIL TEMPLATES =============

export const getEmailTemplates = cache(async () => {
  await requireSuperAdmin();

  return prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });
});

export async function updateEmailTemplate(id: string, data: {
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  isActive?: boolean;
}) {
  await requireSuperAdmin();

  const template = await prisma.emailTemplate.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/emails");

  return template;
}
