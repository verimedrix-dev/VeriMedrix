"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Clock, AlertCircle } from "lucide-react";
import { SubscriptionTier } from "@prisma/client";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-config";
import { updateSubscriptionTier, cancelScheduledTierChange } from "@/lib/actions/practice";
import { toast } from "sonner";

interface BillingSectionProps {
  currentTier: SubscriptionTier;
  scheduledTierChange?: SubscriptionTier | null;
  scheduledTierChangeDate?: Date | null;
  nextBillingDate?: Date | null;
}

const plans: {
  tier: "ESSENTIALS" | "PROFESSIONAL";
  name: string;
  description: string;
  price: number;
  features: string[];
  notIncluded: string[];
}[] = [
  {
    tier: "ESSENTIALS",
    name: "Starter",
    description: "Everything you need for OHSC compliance",
    price: 1999,
    features: [
      "Up to 3 users",
      "Unlimited document management",
      "Task management",
      "Complaints register",
      "Adverse events tracking",
      "Logbook",
      "Inspection readiness",
      "Training management",
    ],
    notIncluded: [
      "Leave management",
      "Payroll & SARS reporting",
      "Locum management",
      "Team invites",
      "AI compliance assistant",
    ],
  },
  {
    tier: "PROFESSIONAL",
    name: "Professional",
    description: "Complete practice management suite",
    price: 3999,
    features: [
      "Unlimited users",
      "Everything in Starter, plus:",
      "Leave management",
      "Payroll with SARS reporting",
      "Locum management",
      "Team invites",
      "AI compliance assistant",
      "Priority support",
    ],
    notIncluded: [],
  },
];

export function BillingSection({
  currentTier,
  scheduledTierChange,
  scheduledTierChangeDate,
  nextBillingDate
}: BillingSectionProps) {
  const { refresh, isPending } = useRefresh();
  const [changingTo, setChangingTo] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleChangePlan = async (tier: "ESSENTIALS" | "PROFESSIONAL") => {
    if (tier === currentTier && !scheduledTierChange) return;

    setChangingTo(tier);
    try {
      const result = await updateSubscriptionTier(tier);
      toast.success(result.message);
      setChangingTo(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change plan");
      setChangingTo(null);
    }
  };

  const handleCancelScheduledChange = async () => {
    setCancelling(true);
    try {
      await cancelScheduledTierChange();
      toast.success("Scheduled downgrade has been cancelled");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel scheduled change");
    } finally {
      setCancelling(false);
    }
  };

  const currentPlan = SUBSCRIPTION_LIMITS[currentTier];
  const scheduledPlan = scheduledTierChange ? SUBSCRIPTION_LIMITS[scheduledTierChange] : null;

  return (
    <div className="space-y-6">
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
              . You will continue to have access to Professional features until then.
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
              "Keep Professional"
            )}
          </Button>
        </div>
      )}

      {/* Current Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg dark:text-white">{currentPlan.displayName} Plan</p>
                <Badge className="bg-blue-600">Current</Badge>
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
          <div className="grid md:grid-cols-2 gap-6">
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
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent && !scheduledTierChange || isPending}
                    onClick={() => handleChangePlan(plan.tier)}
                  >
                    {isChanging ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isUpgrade ? "Upgrading..." : "Scheduling..."}
                      </>
                    ) : isCurrent && scheduledTierChange ? (
                      "Cancel Downgrade"
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : isScheduled ? (
                      "Cancel Scheduled Change"
                    ) : isUpgrade ? (
                      "Upgrade Now"
                    ) : (
                      "Schedule Downgrade"
                    )}
                  </Button>

                  {/* Info text for downgrade */}
                  {!isCurrent && !isUpgrade && !isScheduled && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                      Takes effect on next billing date
                    </p>
                  )}
                  {/* Info text for upgrade */}
                  {!isCurrent && isUpgrade && (
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                      Upgrade immediately, pay R{(plan.price - currentPlan.price).toLocaleString()} difference
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
              <p className="text-sm text-slate-600 dark:text-slate-400">Next billing date</p>
              <p className="font-medium dark:text-white">
                {nextBillingDate
                  ? new Date(nextBillingDate).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">Next charge</p>
              <p className="font-medium dark:text-white">
                R{(scheduledPlan?.price ?? currentPlan.price).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Note: This is a demo. In production, plan changes would go through a payment provider with actual billing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
