import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getMyLocumDashboard } from "@/lib/actions/locums";
import { redirect } from "next/navigation";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Banknote,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function getStatusBadge(status: string, paymentStatus: string) {
  if (paymentStatus === "PAID") {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Banknote className="h-3 w-3 mr-1" />
        Paid
      </Badge>
    );
  }

  switch (status) {
    case "CLOCKED_IN":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="h-3 w-3 mr-1" />
          Working
        </Badge>
      );
    case "CLOCKED_OUT":
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending Approval
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function MyTimesheetsPage() {
  await requirePermission(PERMISSIONS.LOCUMS);

  const data = await getMyLocumDashboard();

  if (!data) {
    redirect("/dashboard");
  }

  const { locum, stats, allTimesheets } = data;

  // Filter timesheets by status
  const pendingTimesheets = allTimesheets.filter((ts) => ts.status === "CLOCKED_OUT");
  const approvedTimesheets = allTimesheets.filter(
    (ts) => ts.status === "APPROVED" || ts.paymentStatus === "PAID"
  );
  const rejectedTimesheets = allTimesheets.filter((ts) => ts.status === "REJECTED");
  const currentlyWorking = allTimesheets.filter((ts) => ts.status === "CLOCKED_IN");

  const TimesheetTable = ({
    timesheets,
    showRejectionNote = false,
  }: {
    timesheets: typeof allTimesheets;
    showRejectionNote?: boolean;
  }) => {
    if (timesheets.length === 0) {
      return (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No timesheets
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            No timesheets found in this category.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead>Break</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead>Status</TableHead>
              {showRejectionNote && <TableHead>Reason</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheets.map((ts) => (
              <TableRow key={ts.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {format(new Date(ts.date), "dd MMM yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  {ts.clockIn ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      {format(new Date(ts.clockIn), "HH:mm")}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {ts.clockOut ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      {format(new Date(ts.clockOut), "HH:mm")}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{ts.breakMinutes > 0 ? `${ts.breakMinutes}m` : "-"}</TableCell>
                <TableCell className="text-right">
                  {ts.hoursWorked?.toFixed(1) || "-"}h
                </TableCell>
                <TableCell className="text-right font-medium">
                  {ts.totalPayable
                    ? `R${ts.totalPayable.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}`
                    : "-"}
                </TableCell>
                <TableCell>{getStatusBadge(ts.status, ts.paymentStatus)}</TableCell>
                {showRejectionNote && (
                  <TableCell>
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {ts.rejectionNote || "-"}
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Timesheets</h1>
          <p className="text-slate-600 dark:text-slate-400">
            View all your submitted timesheets and their approval status
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-lg font-semibold">{stats.pendingApproval}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-slate-500">Approved</p>
                <p className="text-lg font-semibold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-500">Rejected</p>
                <p className="text-lg font-semibold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Total Hours</p>
                <p className="text-lg font-semibold">{stats.totalHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currently Working Alert */}
      {currentlyWorking.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Currently Working</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Clocked in at{" "}
                  {currentlyWorking[0].clockIn
                    ? format(new Date(currentlyWorking[0].clockIn), "HH:mm")
                    : "-"}{" "}
                  on {format(new Date(currentlyWorking[0].date), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timesheets Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timesheet History
          </CardTitle>
          <CardDescription>
            {stats.totalTimesheets} total timesheet{stats.totalTimesheets !== 1 ? "s" : ""} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({allTimesheets.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingTimesheets.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedTimesheets.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedTimesheets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <TimesheetTable timesheets={allTimesheets} />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <TimesheetTable timesheets={pendingTimesheets} />
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              <TimesheetTable timesheets={approvedTimesheets} />
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              <TimesheetTable timesheets={rejectedTimesheets} showRejectionNote />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
