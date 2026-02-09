import { SubscriptionTier } from "@prisma/client";

/**
 * VeriMedrix Subscription Plans
 *
 * Practice Essentials: R999/month
 * - Unlimited users
 * - HR features: Team, Leave Management, Payroll, Locums, Training
 * - SARS Reports, Financial Metrics, Inventory Management
 * - Tasks
 * - No: Compliance features (Documents, Complaints, Adverse Events, Logbook, Inspection Readiness), AI Assistant, Templates
 *
 * OHSC Essential: R1,999/month
 * - Unlimited users
 * - Unlimited documents
 * - Tasks, Complaints, Adverse Events, Logbook, Inspection Readiness, Training
 * - No: Leave Management, Payroll, Locums, Team Invites, SARS Reports, AI Assistant, Financial Metrics, Inventory, Templates
 *
 * OHSC Professional: R4,999/month
 * - Unlimited users
 * - Everything included
 * - Leave Management, Unlimited Payroll, Locums, Team Invites, SARS Reports, AI Assistant, Financial Metrics, Inventory, Templates
 */
export const SUBSCRIPTION_LIMITS = {
  ESSENTIALS: {
    maxUsers: null, // Unlimited
    displayName: "OHSC Essential",
    price: 1999,
    features: {
      // Included in Starter - Compliance features
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
      financialMetrics: false,
      inventory: false,
      templates: false,
    },
  },
  HR_MANAGEMENT: {
    maxUsers: null, // Unlimited
    displayName: "Practice Essentials",
    price: 999,
    features: {
      // HR-focused features
      tasks: true,
      training: true,
      leaveManagement: true,
      payroll: true,
      locums: true,
      teamInvites: true,
      sarsReports: true,
      financialMetrics: true,
      inventory: true,
      // Not included - Compliance features
      documents: false,
      complaints: false,
      adverseEvents: false,
      logbook: false,
      inspectionReadiness: false,
      aiAssistant: false,
      templates: false,
    },
  },
  PROFESSIONAL: {
    maxUsers: null, // Unlimited
    displayName: "OHSC Professional",
    price: 4999,
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
      financialMetrics: true,
      inventory: true,
      templates: true,
    },
  },
  // Enterprise kept for schema compatibility but treated same as OHSC Professional
  ENTERPRISE: {
    maxUsers: null,
    displayName: "OHSC Professional",
    price: 4999,
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
      financialMetrics: true,
      inventory: true,
      templates: true,
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
  financialMetrics: "Financial Metrics Dashboard",
  inventory: "Inventory Management",
  templates: "Templates",
};
