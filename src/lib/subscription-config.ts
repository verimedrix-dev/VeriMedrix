import { SubscriptionTier } from "@prisma/client";

/**
 * Subscription plan limits configuration
 *
 * Starter (ESSENTIALS): R1,999/month
 * - 3 users
 * - Unlimited documents
 * - Tasks, Complaints, Adverse Events, Logbook, Inspection Readiness, Training
 * - No: Leave Management, Payroll, Locums, Team Invites, SARS Reports, AI Assistant
 *
 * Professional: R3,999/month
 * - Unlimited users
 * - Everything in Starter plus:
 * - Leave Management, Unlimited Payroll, Locums, Team Invites, SARS Reports, AI Assistant
 */
export const SUBSCRIPTION_LIMITS = {
  ESSENTIALS: {
    maxUsers: 3,
    displayName: "Starter",
    price: 1999,
    features: {
      // Included in Starter
      documents: true,
      tasks: true,
      complaints: true,
      adverseEvents: true,
      logbook: true,
      inspectionReadiness: true,
      training: true,
      // Not included in Starter
      leaveManagement: false,
      payroll: false,
      locums: false,
      teamInvites: false,
      sarsReports: false,
      aiAssistant: false,
    },
  },
  PROFESSIONAL: {
    maxUsers: null, // Unlimited
    displayName: "Professional",
    price: 3999,
    features: {
      // All features included
      documents: true,
      tasks: true,
      complaints: true,
      adverseEvents: true,
      logbook: true,
      inspectionReadiness: true,
      training: true,
      leaveManagement: true,
      payroll: true,
      locums: true,
      teamInvites: true,
      sarsReports: true,
      aiAssistant: true,
    },
  },
  // Enterprise kept for schema compatibility but treated same as Professional
  ENTERPRISE: {
    maxUsers: null,
    displayName: "Professional",
    price: 3999,
    features: {
      documents: true,
      tasks: true,
      complaints: true,
      adverseEvents: true,
      logbook: true,
      inspectionReadiness: true,
      training: true,
      leaveManagement: true,
      payroll: true,
      locums: true,
      teamInvites: true,
      sarsReports: true,
      aiAssistant: true,
    },
  },
} as const;

export type SubscriptionLimitConfig = (typeof SUBSCRIPTION_LIMITS)[SubscriptionTier];
export type FeatureKey = keyof SubscriptionLimitConfig["features"];

/**
 * Get the user limit for a subscription tier
 */
export function getUserLimit(tier: SubscriptionTier): number | null {
  return SUBSCRIPTION_LIMITS[tier].maxUsers;
}

/**
 * Check if a feature is available for a subscription tier
 */
export function isFeatureAvailable(
  tier: SubscriptionTier,
  feature: FeatureKey
): boolean {
  return SUBSCRIPTION_LIMITS[tier].features[feature];
}

/**
 * Get remaining user slots as a formatted string
 */
export function formatRemainingSlots(remainingSlots: number | null): string {
  if (remainingSlots === null) {
    return "Unlimited";
  }
  if (remainingSlots === 0) {
    return "No slots available";
  }
  return `${remainingSlots} slot${remainingSlots === 1 ? "" : "s"} remaining`;
}

/**
 * Feature display names for UI
 */
export const FEATURE_DISPLAY_NAMES: Record<FeatureKey, string> = {
  documents: "Document Management",
  tasks: "Task Management",
  complaints: "Complaints Register",
  adverseEvents: "Adverse Events Register",
  logbook: "Daily Logbook",
  inspectionReadiness: "Inspection Readiness Dashboard",
  training: "Training Tracking",
  leaveManagement: "Leave Management",
  payroll: "Payroll",
  locums: "Locum Management",
  teamInvites: "Team Invitations",
  sarsReports: "SARS Reporting",
  aiAssistant: "AI Assistant",
};
