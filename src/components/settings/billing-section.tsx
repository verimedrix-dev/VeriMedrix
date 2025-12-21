"use client";

import { useState } from "react";
import { useRefresh } from "@/hooks/use-refresh";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { SubscriptionTier } from "@prisma/client";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-config";
import { updateSubscriptionTier } from "@/lib/actions/practice";

interface BillingSectionProps {
  currentTier: SubscriptionTier;
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
    name: "Essentials",
    description: "Perfect for small practices",
    price: 1999,
    features: [
      "Up to 6 users",
      "OHSC Document Management",
      "Task Management",
      "Calendar & Scheduling",
      "Employee Management",
      "Leave Management",
    ],
    notIncluded: [
      "AI Compliance Assistant",
      "Locum Management",
      "Payroll Management",
      "Training Management",
      "Priority Support",
    ],
  },
  {
    tier: "PROFESSIONAL",
    name: "Professional",
    description: "For growing practices",
    price: 3999,
    features: [
      "Unlimited users",
      "OHSC Document Management",
      "Task Management",
      "Calendar & Scheduling",
      "Employee Management",
      "Leave Management",
      "AI Compliance Assistant",
      "Locum Management",
      "Payroll Management",
      "Training Management",
      "Priority Support",
    ],
    notIncluded: [],
  },
];

export function BillingSection({ currentTier }: BillingSectionProps) {
  const { refresh, isPending } = useRefresh();
  const [changingTo, setChangingTo] = useState<string | null>(null);

  const handleChangePlan = async (tier: "ESSENTIALS" | "PROFESSIONAL") => {
    if (tier === currentTier) return;

    setChangingTo(tier);
    try {
      await updateSubscriptionTier(tier);
      setChangingTo(null);
      refresh();
    } catch {
      setChangingTo(null);
    }
  };

  const currentPlan = SUBSCRIPTION_LIMITS[currentTier];

  return (
    <div className="space-y-6">
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
              const isChanging = changingTo === plan.tier;

              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-xl border-2 p-6 ${
                    isCurrent
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-blue-600">Current Plan</Badge>
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
                    disabled={isCurrent || isPending}
                    onClick={() => handleChangePlan(plan.tier)}
                  >
                    {isChanging ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Switching...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : plan.tier === "PROFESSIONAL" ? (
                      "Upgrade to Professional"
                    ) : (
                      "Downgrade to Essentials"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Billing Info (Static for now) */}
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
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
            Note: This is a demo. In production, plan changes would go through a payment provider.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
