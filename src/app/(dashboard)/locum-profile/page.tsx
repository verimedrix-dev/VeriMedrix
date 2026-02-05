import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getMyLocumProfile } from "@/lib/actions/locums";
import { redirect } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { LocumProfileForm } from "@/components/locums/locum-profile-form";

export const dynamic = "force-dynamic";

function getExpiryStatus(date: Date | null) {
  if (!date) return null;
  const daysUntil = differenceInDays(date, new Date());
  if (isPast(date)) {
    return { status: "expired", label: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  }
  if (daysUntil <= 30) {
    return { status: "expiring", label: `Expires in ${daysUntil} days`, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  }
  return { status: "valid", label: `Valid until ${format(date, "dd MMM yyyy")}`, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

export default async function LocumProfilePage() {
  await requirePermission(PERMISSIONS.LOCUMS);

  const locum = await getMyLocumProfile();

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

  const hpcsaStatus = getExpiryStatus(locum.hpcsaExpiry);
  const indemnityStatus = getExpiryStatus(locum.indemnityInsuranceExpiry);

  // Calculate stats from timesheets
  const totalHours = locum.LocumTimesheet.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);
  const approvedTimesheets = locum.LocumTimesheet.filter(ts => ts.status === "APPROVED" || ts.paymentStatus === "PAID").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
          {locum.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {locum.fullName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {locum.sourceType === "AGENCY" ? (
                <><Building2 className="h-3 w-3 mr-1" />{locum.agencyName || "Agency"}</>
              ) : (
                <><User className="h-3 w-3 mr-1" />Direct Locum</>
              )}
            </Badge>
            <Badge className={locum.isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}>
              {locum.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Total Hours</p>
                <p className="text-lg font-semibold">{totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-slate-500">Approved Shifts</p>
                <p className="text-lg font-semibold">{approvedTimesheets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-green-600">R</span>
              <div>
                <p className="text-xs text-slate-500">Hourly Rate</p>
                <p className="text-lg font-semibold">R{locum.hourlyRate.toFixed(2)}/hr</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editable Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Update your contact details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocumProfileForm
              initialEmail={locum.email || ""}
              initialPhone={locum.phone || ""}
            />
          </CardContent>
        </Card>

        {/* Credentials (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Credentials
            </CardTitle>
            <CardDescription>
              Contact your administrator to update credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* HPCSA */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">HPCSA Registration</p>
                  <p className="text-sm text-slate-500">{locum.hpcsaNumber || "Not provided"}</p>
                </div>
              </div>
              {hpcsaStatus && (
                <Badge className={hpcsaStatus.color}>
                  {hpcsaStatus.status === "expired" && <XCircle className="h-3 w-3 mr-1" />}
                  {hpcsaStatus.status === "expiring" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {hpcsaStatus.status === "valid" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {hpcsaStatus.label}
                </Badge>
              )}
            </div>

            {/* Indemnity Insurance */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Indemnity Insurance</p>
                  <p className="text-sm text-slate-500">{locum.indemnityInsuranceNumber || "Not provided"}</p>
                </div>
              </div>
              {indemnityStatus && (
                <Badge className={indemnityStatus.color}>
                  {indemnityStatus.status === "expired" && <XCircle className="h-3 w-3 mr-1" />}
                  {indemnityStatus.status === "expiring" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {indemnityStatus.status === "valid" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {indemnityStatus.label}
                </Badge>
              )}
            </div>

            {locum.idNumber && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-500">ID Number</p>
                <p className="font-medium">{locum.idNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
