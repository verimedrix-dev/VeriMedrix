import { SubscriptionTier } from "@prisma/client";

/**
 * Subscription plan limits configuration
 * Based on pricing:
 * - Essentials: R1,999/month - Owner + 5 Staff Users (6 total)
 * - Professional: R3,999/month - Unlimited users + Premium features
 */
export const SUBSCRIPTION_LIMITS = {
  ESSENTIALS: {
    maxUsers: 6, // Owner + 5 staff
    displayName: "Essentials",
    price: 1999,
    features: {
      training: false,
      payroll: false,
      locums: false,
      aiAssistant: false,
    },
  },
  PROFESSIONAL: {
    maxUsers: null, // Unlimited
    displayName: "Professional",
    price: 3999,
    features: {
      training: true,
      payroll: true,
      locums: true,
      aiAssistant: true,
    },
  },
  // Enterprise kept for schema compatibility but treated same as Professional
  ENTERPRISE: {
    maxUsers: null,
    displayName: "Professional",
    price: 3999,
    features: {
      training: true,
      payroll: true,
      locums: true,
      aiAssistant: true,
    },
  },
} as const;

export type SubscriptionLimitConfig = (typeof SUBSCRIPTION_LIMITS)[SubscriptionTier];

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
  feature: keyof SubscriptionLimitConfig["features"]
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
