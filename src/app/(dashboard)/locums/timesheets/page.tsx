import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingTimesheets } from "@/lib/actions/locums";
import { requirePermission, isOwner as checkIsOwner } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { TimesheetApprovalTable } from "@/components/locums/timesheet-approval-table";
import { ClipboardCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TimesheetsPage() {
  // Intermediate (ADMIN) and above can view/approve timesheets
  await requirePermission(PERMISSIONS.LOCUMS_FULL);
  const canApprove = true; // Anyone with LOCUMS_FULL can approve
  // Only owner can see rates and financial totals
  const showFinancials = await checkIsOwner();

  const timesheets = await getPendingTimesheets();

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timesheet Approval</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review and approve locum timesheets
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Pending Approval
          </CardTitle>
          <CardDescription>
            {timesheets.length === 0
              ? "No timesheets pending approval"
              : `${timesheets.length} timesheet${timesheets.length === 1 ? "" : "s"} awaiting review`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                All caught up!
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                No timesheets are pending approval right now.
              </p>
            </div>
          ) : (
            <TimesheetApprovalTable timesheets={timesheets} canApprove={canApprove} showFinancials={showFinancials} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
