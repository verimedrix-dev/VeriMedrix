"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, Clock, XCircle } from "lucide-react";

interface InventoryStatsProps {
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export function InventoryStats({
  totalItems,
  lowStockCount,
  expiringSoonCount,
  expiredCount,
}: InventoryStatsProps) {
  const stats = [
    {
      label: "Total Items",
      value: totalItems,
      icon: Package,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Low Stock",
      value: lowStockCount,
      icon: AlertTriangle,
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Expiring Soon",
      value: expiringSoonCount,
      icon: Clock,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Expired",
      value: expiredCount,
      icon: XCircle,
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.iconBg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
