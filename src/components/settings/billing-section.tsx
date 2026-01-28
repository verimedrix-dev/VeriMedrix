"use client";

import { useState, useEffect } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Clock, AlertCircle, History, FlaskConical } from "lucide-react";
import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-config";
import {
  startSubscription,
  upgradeSubscription,
  scheduleDowngrade,
  cancelScheduledDowngrade,
  getPaymentHistory,
  testSwitchPlan,
} from "@/lib/actions/billing";
import { toast } from "sonner";

interface BillingSectionProps {
  currentTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  scheduledTierChange?: SubscriptionTier | null;
  scheduledTierChangeDate?: Date | null;
  nextBillingDate?: Date | null;
  trialEndsAt?: Date | null;
}

const plans: {
  tier: "HR_MANAGEMENT" | "ESSENTIALS" | "PROFESSIONAL";
  name: string;
  description: string;
  price: number;
  features: string[];
  notIncluded: string[];
}[] = [
  {
    tier: "HR_MANAGEMENT",
    name: "HR Management",
    description: "HR & Payroll focused",
    price: 999,
    features: [
      "Up to 3 users",
      "Task management",
      "Training tracking",
      "Leave management",
      "Payroll",
      "Locum management",
      "Team invites",
    ],
    notIncluded: [
      "Document management",
      "Complaints register",
      "Adverse events tracking",
      "Logbook",
      "Custom forms",
      "Inspection readiness",
      "SARS reporting",
      "AI assistant",
      "Financial Metrics Dashboard",
    ],
  },
  {
    tier: "ESSENTIALS",
    name: "OHSC Essential",
    description: "OHSC compliance focused",
    price: 1999,
    features: [
      "Up to 3 users",
      "Unlimited document management",
      "Task management",
      "Complaints register",
      "Adverse events tracking",
      "Logbook",
      "Custom forms",
      "Inspection readiness",
      "Training management",
    ],
    notIncluded: [
      "Leave management",
      "Payroll",
      "Locum management",
      "Team invites",
      "AI assistant",
      "Financial Metrics Dashboard",
    ],
  },
  {
    tier: "PROFESSIONAL",
    name: "OHSC Professional",
    description: "Complete practice management",
    price: 4999,
    features: [
      "Unlimited users",
      "Everything in both plans",
      "Leave management",
      "Payroll with SARS reporting",
      "Locum management",
      "Team invites",
      "AI compliance assistant",
      "Financial Metrics Dashboard",
      "Priority support",
    ],
    notIncluded: [],
  },
];

export function BillingSection({
  currentTier,
  subscriptionStatus,
  scheduledTierChange,
  scheduledTierChangeDate,
  nextBillingDate,
  trialEndsAt,
}: BillingSectionProps) {
  const { refresh, isPending } = useRefresh();
  const [changingTo, setChangingTo] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [testSwitching, setTestSwitching] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<
    Array<{
      id: string;
      amount: number;
      status: string;
      paidAt: Date | null;
      description: string | null;
      createdAt: Date;
    }>
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load payment history
  useEffect(() => {
    setLoadingHistory(true);
    getPaymentHistory(5)
      .then(setPaymentHistory)
      .finally(() => setLoadingHistory(false));
  }, []);

  const handleSubscribe = async (tier: "HR_MANAGEMENT" | "ESSENTIALS" | "PROFESSIONAL") => {
    setChangingTo(tier);
    try {
      const result = await startSubscription(tier);
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast.error(result.error || "Failed to start subscription");
        setChangingTo(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start subscription");
      setChangingTo(null);
    }
  };

  const handleUpgrade = async (tier: "HR_MANAGEMENT" | "ESSENTIALS" | "PROFESSIONAL") => {
    setChangingTo(tier);
    try {
      const result = await upgradeSubscription(tier);
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast.error(result.error || "Failed to process upgrade");
        setChangingTo(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process upgrade");
      setChangingTo(null);
    }
  };

  const handleDowngrade = async (tier: "HR_MANAGEMENT" | "ESSENTIALS" | "PROFESSIONAL") => {
    setChangingTo(tier);
    try {
      const result = await scheduleDowngrade(tier);
      if (result.success) {
        toast.success(
          `Downgrade to ${SUBSCRIPTION_LIMITS[tier].displayName} scheduled for ${
            result.effectiveDate?.toLocaleDateString("en-ZA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }`
        );
        refresh();
      } else {
        toast.error(result.error || "Failed to schedule downgrade");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule downgrade");
    } finally {
      setChangingTo(null);
    }
  };

  const handleCancelScheduledChange = async () => {
    setCancelling(true);
    try {
      const result = await cancelScheduledDowngrade();
      if (result.success) {
        toast.success("Scheduled downgrade has been cancelled");
        refresh();
      } else {
        toast.error(result.error || "Failed to cancel scheduled change");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel scheduled change");
    } finally {
      setCancelling(false);
    }
  };

  // TEST MODE: Quick plan switching for testing
  const handleTestSwitch = async (tier: SubscriptionTier) => {
    setTestSwitching(tier);
    try {
      const result = await testSwitchPlan(tier);
      if (result.success) {
        toast.success(`Switched to ${SUBSCRIPTION_LIMITS[tier].displayName} plan`);
        refresh();
      } else {
        toast.error(result.error || "Failed to switch plan");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to switch plan");
    } finally {
      setTestSwitching(null);
    }
  };

  const handleChangePlan = (tier: "HR_MANAGEMENT" | "ESSENTIALS" | "PROFESSIONAL") => {
    const isUpgrade = SUBSCRIPTION_LIMITS[tier].price > SUBSCRIPTION_LIMITS[currentTier].price;
    const isTrial = subscriptionStatus === "TRIAL";

    if (tier === currentTier && !scheduledTierChange) return;

    // If on trial, start new subscription
    if (isTrial) {
      handleSubscribe(tier);
      return;
    }

    // If has active subscription
    if (isUpgrade) {
      handleUpgrade(tier);
    } else {
      handleDowngrade(tier);
    }
  };

  const currentPlan = SUBSCRIPTION_LIMITS[currentTier];
  const scheduledPlan = scheduledTierChange ? SUBSCRIPTION_LIMITS[scheduledTierChange] : null;
  const isTrial = subscriptionStatus === "TRIAL";
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      {isTrial && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-800 dark:text-blue-200">
              You&apos;re on a free trial
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {trialDaysLeft > 0
                ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining. Subscribe now to continue using all features.`
                : "Your trial has ended. Subscribe to continue using all features."}
            </p>
          </div>
        </div>
      )}

      {/* Scheduled Change Banner */}
      {scheduledTierChange && scheduledTierChangeDate && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Downgrade scheduled
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Your plan will change to {scheduledPlan?.displayName} on{" "}
              {new Date(scheduledTierChangeDate).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              . You will continue to have access to current features until then.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelScheduledChange}
            disabled={cancelling}
            className="shrink-0"
          >
            {cancelling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Keep Current Plan"
            )}
          </Button>
        </div>
      )}

      {/* TEST MODE - Quick Plan Switching */}
      <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-purple-800 dark:text-purple-200">Test Mode</CardTitle>
          </div>
          <CardDescription className="text-purple-600 dark:text-purple-400">
            Quick plan switching for testing. Remove before production.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["HR_MANAGEMENT", "ESSENTIALS", "PROFESSIONAL"] as SubscriptionTier[]).map((tier) => {
              const plan = SUBSCRIPTION_LIMITS[tier];
              const isCurrent = tier === currentTier;
              const isLoading = testSwitching === tier;

              return (
                <Button
                  key={tier}
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  disabled={isCurrent || testSwitching !== null}
                  onClick={() => handleTestSwitch(tier)}
                  className={isCurrent ? "bg-purple-600 hover:bg-purple-700" : "border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/30"}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  {plan.displayName}
                  <span className="ml-1 text-xs opacity-70">R{plan.price}</span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-purple-500 dark:text-purple-400 mt-3">
            Click any plan to instantly switch. This bypasses payment flow.
          </p>
        </CardContent>
      </Card>

      {/* Current Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your subscription information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg dark:text-white">{currentPlan.displayName} Plan</p>
                <Badge className="bg-blue-600">
                  {isTrial ? "Trial" : "Active"}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                R{currentPlan.price.toLocaleString()}/month
                {currentPlan.maxUsers === null
                  ? " • Unlimited users"
                  : ` • Up to ${currentPlan.maxUsers} users`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Compare plans and switch anytime
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.tier === currentTier;
              const isScheduled = plan.tier === scheduledTierChange;
              const isChanging = changingTo === plan.tier;
              const isUpgrade = plan.price > currentPlan.price;

              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-xl border-2 p-6 ${
                    isCurrent
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                      : isScheduled
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/30"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-blue-600">Current Plan</Badge>
                    </div>
                  )}
                  {isScheduled && !isCurrent && (
                    <div className="absolute -top-3 left-4">
                      <Badge variant="outline" className="bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Scheduled
                      </Badge>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold dark:text-white">
                      R{plan.price.toLocaleString()}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">/month</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm dark:text-slate-300">{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 opacity-50">
                        <span className="h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-slate-400">-</span>
                        </span>
                        <span className="text-sm text-slate-500 line-through">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrent && !isTrial ? "outline" : "default"}
                    disabled={(isCurrent && !scheduledTierChange && !isTrial) || isPending}
                    onClick={() => handleChangePlan(plan.tier)}
                  >
                    {isChanging ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent && scheduledTierChange ? (
                      "Cancel Downgrade"
                    ) : isCurrent && isTrial ? (
                      "Subscribe Now"
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : isScheduled ? (
                      "Cancel Scheduled Change"
                    ) : isTrial ? (
                      "Subscribe"
                    ) : isUpgrade ? (
                      "Upgrade Now"
                    ) : (
                      "Schedule Downgrade"
                    )}
                  </Button>

                  {/* Info text for downgrade */}
                  {!isCurrent && !isUpgrade && !isScheduled && !isTrial && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                      Takes effect on next billing date
                    </p>
                  )}
                  {/* Info text for upgrade */}
                  {!isCurrent && isUpgrade && !isTrial && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                      Upgrade immediately
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing Info */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">Billing cycle</p>
              <p className="font-medium dark:text-white">Monthly</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isTrial ? "Trial ends" : "Next billing date"}
              </p>
              <p className="font-medium dark:text-white">
                {isTrial && trialEndsAt
                  ? new Date(trialEndsAt).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : nextBillingDate
                  ? new Date(nextBillingDate).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </p>
            </div>
            {!isTrial && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">Next charge</p>
                <p className="font-medium dark:text-white">
                  R{(scheduledPlan?.price ?? currentPlan.price).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <CardTitle>Payment History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium dark:text-white">
                        {payment.description || "Payment"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payment.paidAt
                          ? new Date(payment.paidAt).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : new Date(payment.createdAt).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium dark:text-white">
                        R{(payment.amount / 100).toLocaleString()}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          payment.status === "SUCCESS"
                            ? "text-green-600 border-green-300"
                            : payment.status === "PENDING"
                            ? "text-amber-600 border-amber-300"
                            : "text-red-600 border-red-300"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
