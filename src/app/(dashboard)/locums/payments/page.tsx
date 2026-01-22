import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnpaidTimesheets } from "@/lib/actions/locums";
import { requireOwner } from "@/lib/auth";
import { PaymentTable } from "@/components/locums/payment-table";
import { DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PaymentsPage() {
  // Only practice owners can view payment/financial information
  await requireOwner();
  const canManage = true; // Owner always has management rights

  const unpaidTimesheets = await getUnpaidTimesheets();

  // Group by locum
  const byLocum = unpaidTimesheets.reduce((acc, ts) => {
    const locumId = ts.locumId;
    if (!acc[locumId]) {
      acc[locumId] = {
        locum: ts.Locum,
        timesheets: [],
        totalHours: 0,
        totalPayable: 0,
      };
    }
    acc[locumId].timesheets.push(ts);
    acc[locumId].totalHours += ts.hoursWorked || 0;
    acc[locumId].totalPayable += ts.totalPayable || 0;
    return acc;
  }, {} as Record<string, { locum: typeof unpaidTimesheets[0]["Locum"]; timesheets: typeof unpaidTimesheets; totalHours: number; totalPayable: number }>);

  const locumPayments = Object.values(byLocum);
  const totalHours = locumPayments.reduce((sum, l) => sum + l.totalHours, 0);

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Locum Payments</h1>
          <p className="text-slate-600 dark:text-slate-400">
            View and process payments for approved timesheets
          </p>
        </div>
      </div>

      {/* Summary - No monetary totals shown for privacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Locums to Pay</CardDescription>
            <CardTitle className="text-3xl">{locumPayments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hours</CardDescription>
            <CardTitle className="text-3xl">{totalHours.toFixed(1)}h</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Unpaid Approved Timesheets
          </CardTitle>
          <CardDescription>
            {unpaidTimesheets.length === 0
              ? "No unpaid timesheets"
              : `${unpaidTimesheets.length} timesheet${unpaidTimesheets.length === 1 ? "" : "s"} ready for payment`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unpaidTimesheets.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No pending payments
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                All approved timesheets have been marked as paid.
              </p>
            </div>
          ) : (
            <PaymentTable locumPayments={locumPayments} canManage={canManage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
