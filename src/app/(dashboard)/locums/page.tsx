import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Stethoscope,
  Clock,
  Users,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  ClipboardCheck,
  Building,
} from "lucide-react";
import Link from "next/link";
import { getLocums, getLocumStats } from "@/lib/actions/locums";
import { requirePermission, checkPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

// Dynamic import for dialog - not needed on initial render
const AddLocumDialog = dynamic(
  () => import("@/components/locums/add-locum-dialog").then((mod) => mod.AddLocumDialog),
  {
    loading: () => <Skeleton className="h-10 w-32" />,
  }
);

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function LocumsPage() {
  await requirePermission(PERMISSIONS.EMPLOYEES);
  const canEdit = await checkPermission(PERMISSIONS.EMPLOYEES_CRUD);

  const [locums, stats] = await Promise.all([
    getLocums(),
    getLocumStats(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Locums</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage locum staff, track hours, and process payments
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && <AddLocumDialog />}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Active Locums
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats?.activeLocums || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              of {stats?.totalLocums || 0} total registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
              Currently Working
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400">
              {stats?.currentlyWorking || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clocked in right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Pending Approval
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {stats?.pendingApproval || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/locums/timesheets" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Review timesheets →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              This Month
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {stats?.monthlyHours?.toFixed(0) || 0}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              R{stats?.monthlyPayable?.toLocaleString() || 0} payable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/locums/clock">
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            Clock In/Out
          </Button>
        </Link>
        <Link href="/locums/timesheets">
          <Button variant="outline" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Approve Timesheets
            {stats?.pendingApproval ? (
              <Badge variant="destructive" className="ml-1">{stats.pendingApproval}</Badge>
            ) : null}
          </Button>
        </Link>
        <Link href="/locums/payments">
          <Button variant="outline" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payment Reports
          </Button>
        </Link>
      </div>

      {/* Locum List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Locums</CardTitle>
          <CardDescription>
            Click on a locum to view their profile and timesheet history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locums.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No locums registered
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {canEdit
                  ? "Add your first locum to start tracking their hours."
                  : "No locums have been registered yet."
                }
              </p>
              {canEdit && <AddLocumDialog />}
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {locums.map((locum) => {
                const isClockedIn = locum.LocumTimesheet?.length > 0;
                const hasExpiringCredentials =
                  (locum.hpcsaExpiry && new Date(locum.hpcsaExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) ||
                  (locum.indemnityInsuranceExpiry && new Date(locum.indemnityInsuranceExpiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

                return (
                  <Link
                    key={locum.id}
                    href={`/locums/${locum.id}`}
                    className="flex items-center justify-between py-4 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100 font-medium">
                          {getInitials(locum.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900 dark:text-white">
                            {locum.fullName}
                          </h3>
                          {isClockedIn && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              Working
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          {locum.sourceType === "AGENCY" ? (
                            <>
                              <Building className="h-3 w-3" />
                              {locum.agencyName || "Agency"}
                            </>
                          ) : (
                            "Direct Hire"
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs gap-1">
                            <DollarSign className="h-3 w-3" />
                            R{locum.hourlyRate}/hr
                          </Badge>
                          {locum.email && (
                            <span className="text-xs text-slate-400">{locum.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasExpiringCredentials && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Credentials Expiring
                        </Badge>
                      )}
                      {locum.hpcsaNumber && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          HPCSA
                        </Badge>
                      )}
                      {!locum.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
