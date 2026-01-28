"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lock, CheckCircle } from "lucide-react";
import Link from "next/link";

export function UpgradePrompt() {
  const features = [
    "Track 11 key financial metrics",
    "Color-coded status indicators (green/amber/red)",
    "Month-over-month trend analysis",
    "Profit First allocation tracking",
    "Days Sales Outstanding monitoring",
    "Expense ratio benchmarking",
  ];

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex justify-center mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Professional Plan Feature
            </Badge>
          </div>
          <CardTitle className="text-2xl">Financial Metrics Dashboard</CardTitle>
          <CardDescription className="text-base">
            Unlock powerful financial tracking tools to monitor your practice&apos;s financial health.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-400">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-slate-900 dark:text-white">OHSC Professional</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Get unlimited users, AI Assistant, SARS Reporting, and the Financial Metrics Dashboard.
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              R4,999<span className="text-sm font-normal text-slate-500">/month</span>
            </p>
          </div>

          <Link href="/settings" className="block">
            <Button className="w-full" size="lg">
              Upgrade to Professional
            </Button>
          </Link>

          <p className="text-xs text-center text-slate-500">
            Contact support for enterprise pricing or custom requirements.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
