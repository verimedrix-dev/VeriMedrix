"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AIAssistantUpgradeProps {
  currentPlan: string;
}

const AI_FEATURES = [
  "Instant compliance status analysis",
  "Document gap identification",
  "Employee certification tracking",
  "OHSC inspection preparation",
  "Real-time compliance recommendations",
  "Natural language questions about your practice",
];

export function AIAssistantUpgrade({ currentPlan }: AIAssistantUpgradeProps) {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-lg">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          AI Compliance Assistant
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Your intelligent guide to OHSC compliance, powered by advanced AI
        </p>
      </div>

      <Card className="mb-8 border-2 border-dashed border-slate-200 dark:border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Professional Plan Feature
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You&apos;re currently on the {currentPlan} plan
              </p>
            </div>
          </div>

          <div className="grid gap-3 mb-6">
            {AI_FEATURES.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Upgrade to Professional</strong> to unlock the AI Compliance Assistant
              along with unlimited users, training management, payroll, and locum management.
            </p>
          </div>

          <Link href="/settings?tab=billing">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Upgrade to Professional
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Have questions? Contact our support team for more information about our plans.
      </p>
    </div>
  );
}
