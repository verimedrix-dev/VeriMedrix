import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocums } from "@/lib/actions/locums";
import { requirePermission, isOwner as checkIsOwner } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { ClockInOutCard } from "@/components/locums/clock-in-out-card";
import { Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ClockPage() {
  // All staff can access clock in/out page
  await requirePermission(PERMISSIONS.LOCUMS_CLOCK);
  // Only owner can see rates
  const showRate = await checkIsOwner();

  const locums = await getLocums();
  const activeLocums = locums.filter(l => l.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/locums">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clock In/Out</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Select a locum to clock in or out
          </p>
        </div>
      </div>

      {activeLocums.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No active locums
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Add locums first before using the clock in/out feature.
              </p>
              <Link href="/locums">
                <Button variant="outline">Go to Locums</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLocums.map((locum) => (
            <ClockInOutCard
              key={locum.id}
              locum={{
                id: locum.id,
                fullName: locum.fullName,
                hourlyRate: locum.hourlyRate,
                sourceType: locum.sourceType,
                agencyName: locum.agencyName,
              }}
              currentTimesheet={locum.LocumTimesheet?.[0] || null}
              showRate={showRate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
