import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLocum } from "@/lib/actions/locums";
import { requirePermission, checkPermission, isOwner as checkIsOwner } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pencil
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays, isPast } from "date-fns";
import { LocumTimesheetHistory } from "@/components/locums/locum-timesheet-history";
import { EditLocumDialog } from "@/components/locums/edit-locum-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LocumProfilePage({ params }: Props) {
  await requirePermission(PERMISSIONS.EMPLOYEES);
  const canManage = await checkPermission(PERMISSIONS.EMPLOYEES_CRUD);
  const ownerAccess = await checkIsOwner();

  const { id } = await params;
  const locum = await getLocum(id);

  if (!locum) {
    notFound();
  }

  const getExpiryStatus = (date: Date | null) => {
    if (!date) return null;
    const daysUntil = differenceInDays(date, new Date());
    if (isPast(date)) {
      return { status: "expired", label: "Expired", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    }
    if (daysUntil <= 30) {
      return { status: "expiring", label: `Expires in ${daysUntil} days`, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    }
    return { status: "valid", label: `Valid until ${format(date, "dd MMM yyyy")}`, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
  };

  const hpcsaStatus = getExpiryStatus(locum.hpcsaExpiry);
  const indemnityStatus = getExpiryStatus(locum.indemnityInsuranceExpiry);

  // Calculate stats from timesheets
  const totalHours = locum.LocumTimesheet.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);
  const totalEarnings = locum.LocumTimesheet.reduce((sum, ts) => sum + (ts.totalPayable || 0), 0);
  const approvedCount = locum.LocumTimesheet.filter(ts => ts.status === "APPROVED" || ts.paymentStatus === "PAID").length;
  const pendingCount = locum.LocumTimesheet.filter(ts => ts.status === "CLOCKED_OUT").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/locums">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center gap-4">
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
        {canManage && (
          <EditLocumDialog locum={locum}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </EditLocumDialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        {ownerAccess && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-slate-500">Total Earnings</p>
                  <p className="text-lg font-semibold">R{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-slate-500">Shifts Completed</p>
                <p className="text-lg font-semibold">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-slate-500">Pending Approval</p>
                <p className="text-lg font-semibold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {locum.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-medium">{locum.email}</p>
                </div>
              </div>
            )}
            {locum.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium">{locum.phone}</p>
                </div>
              </div>
            )}
            {locum.idNumber && (
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">ID Number</p>
                  <p className="font-medium">{locum.idNumber}</p>
                </div>
              </div>
            )}
            {ownerAccess && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Hourly Rate</p>
                  <p className="font-medium">R{locum.hourlyRate.toFixed(2)}/hr</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Documents</CardTitle>
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

            {locum.notes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{locum.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timesheet History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timesheet History
          </CardTitle>
          <CardDescription>
            {locum.LocumTimesheet.length === 0
              ? "No timesheets recorded yet"
              : `${locum.LocumTimesheet.length} timesheet${locum.LocumTimesheet.length === 1 ? "" : "s"} recorded`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locum.LocumTimesheet.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No timesheets yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Timesheets will appear here once the locum clocks in.
              </p>
            </div>
          ) : (
            <LocumTimesheetHistory timesheets={locum.LocumTimesheet} showFinancials={ownerAccess} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
