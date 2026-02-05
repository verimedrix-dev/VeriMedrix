import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getMyLocumProfile, getMyClockStatus } from "@/lib/actions/locums";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ClockInOutButtons } from "@/components/locums/clock-in-out-buttons";

export const dynamic = "force-dynamic";

export default async function ClockPage() {
  await requirePermission(PERMISSIONS.LOCUMS);

  const locum = await getMyLocumProfile();
  const clockStatus = await getMyClockStatus();

  if (!locum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Clock className="h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
          Account Setup Pending
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
          Your locum profile is being set up. Please contact your practice administrator if this persists.
        </p>
      </div>
    );
  }

  const isClockedIn = clockStatus?.status === "CLOCKED_IN";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Clock In / Out
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Record your working hours
        </p>
      </div>

      {/* Current Date/Time */}
      <Card>
        <CardHeader className="text-center pb-2">
          <CardDescription className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-5xl font-bold text-slate-900 dark:text-white tabular-nums">
            <CurrentTime />
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className={isClockedIn ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800" : ""}>
        <CardHeader>
          <CardTitle className="text-center">
            {isClockedIn ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                Currently Working
              </div>
            ) : (
              "Not Clocked In"
            )}
          </CardTitle>
          {isClockedIn && clockStatus?.clockIn && (
            <CardDescription className="text-center">
              Clocked in at {format(new Date(clockStatus.clockIn), "HH:mm")}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ClockInOutButtons
            isClockedIn={isClockedIn}
            clockInTime={clockStatus?.clockIn ? new Date(clockStatus.clockIn) : null}
          />
        </CardContent>
      </Card>

      {/* Rate Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">Your hourly rate</p>
            <p className="text-2xl font-bold text-green-600">
              R{locum.hourlyRate.toFixed(2)}/hr
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Client component for live time
function CurrentTime() {
  return <LiveClock />;
}

import { LiveClock } from "@/components/locums/live-clock";
