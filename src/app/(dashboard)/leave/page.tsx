import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarOff,
  Check,
  Clock,
  Calendar,
  Palmtree,
  Stethoscope,
  Users,
} from "lucide-react";
import { getLeaveRequests, getEmployeesWithLeaveBalances } from "@/lib/actions/employees";
import { getCurrentUserRole, getMyLeaveBalance, getMyLeaveRequests, getMyEmployeeId } from "@/lib/actions/personal";
import { format } from "date-fns";
import { LeaveActions } from "@/components/leave/leave-actions";

// Dynamic import for dialogs - not needed on initial render
const MyLeaveRequestDialog = dynamic(
  () => import("@/components/leave/my-leave-request-dialog").then((mod) => mod.MyLeaveRequestDialog),
  {
    loading: () => <Skeleton className="h-10 w-36" />,
  }
);

const AdminLeaveDialog = dynamic(
  () => import("@/components/leave/admin-leave-dialog").then((mod) => mod.AdminLeaveDialog),
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

export default async function LeavePage() {
  const userRole = await getCurrentUserRole();

  // Check if user is a regular employee (STAFF or VIEWER)
  const isEmployee = userRole === "STAFF" || userRole === "VIEWER";

  if (isEmployee) {
    // Get employee's personal leave data
    const [leaveBalance, myLeaveRequests, myEmployee] = await Promise.all([
      getMyLeaveBalance(),
      getMyLeaveRequests(),
      getMyEmployeeId(),
    ]);

    if (!leaveBalance || !myEmployee) {
      return (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Leave</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Your employee profile is not linked. Please contact your administrator.
            </p>
          </div>
        </div>
      );
    }

    const pendingRequests = myLeaveRequests.filter(r => r.status === "PENDING");

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Leave</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              View your leave balances and apply for leave
            </p>
          </div>
          <MyLeaveRequestDialog
            employeeId={myEmployee.id}
            leaveBalances={{
              annual: leaveBalance.annualLeaveBalance,
              sick: leaveBalance.sickLeaveBalance,
              family: leaveBalance.familyLeaveBalance,
            }}
          />
        </div>

        {/* Leave Balances */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Palmtree className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Annual Leave</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {leaveBalance.annualLeaveBalance} <span className="text-sm font-normal text-slate-500">days</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Sick Leave</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {leaveBalance.sickLeaveBalance} <span className="text-sm font-normal text-slate-500">days</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Family Responsibility</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {leaveBalance.familyLeaveBalance} <span className="text-sm font-normal text-slate-500">days</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle>Pending Requests</CardTitle>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                  {pendingRequests.length}
                </Badge>
              </div>
              <CardDescription>
                Your leave requests awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y dark:divide-slate-700">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <p className="font-medium dark:text-white">
                        {request.leaveType.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(request.startDate), "MMM d")} to{" "}
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {request.totalDays} day{request.totalDays !== 1 ? "s" : ""}
                        {request.reason && ` - ${request.reason}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leave History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle>Leave History</CardTitle>
            </div>
            <CardDescription>
              Your past leave requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myLeaveRequests.length === 0 ? (
              <div className="text-center py-8">
                <CalendarOff className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No leave requests yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Click &quot;Apply for Leave&quot; to submit your first request
                </p>
              </div>
            ) : (
              <div className="divide-y dark:divide-slate-700">
                {myLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div>
                      <p className="font-medium dark:text-white">
                        {request.leaveType.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {format(new Date(request.startDate), "MMM d")} to{" "}
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {request.totalDays} day{request.totalDays !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        request.status === "APPROVED"
                          ? "default"
                          : request.status === "DECLINED"
                          ? "destructive"
                          : request.status === "CANCELLED"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        request.status === "APPROVED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : ""
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin/Owner view - original page
  const [pendingRequests, allRequests, employeesWithBalances] = await Promise.all([
    getLeaveRequests({ status: "PENDING" }),
    getLeaveRequests(),
    getEmployeesWithLeaveBalances(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leave Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Review and manage employee leave requests
          </p>
        </div>
        <AdminLeaveDialog employees={employeesWithBalances} />
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle>Pending Approvals</CardTitle>
            {pendingRequests.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                {pendingRequests.length}
              </Badge>
            )}
          </div>
          <CardDescription>
            Leave requests awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <Check className="h-12 w-12 mx-auto text-green-300 dark:text-green-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No pending leave requests</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white">
                        {getInitials(request.Employee.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium dark:text-white">{request.Employee.fullName}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {request.leaveType.replace(/_/g, " ")} -{" "}
                        {format(new Date(request.startDate), "MMM d")} to{" "}
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {request.totalDays} day{request.totalDays !== 1 ? "s" : ""}
                        {request.reason && ` - ${request.reason}`}
                      </p>
                    </div>
                  </div>
                  <LeaveActions
                    requestId={request.id}
                    employeeName={request.Employee.fullName}
                    leaveType={request.leaveType}
                    totalDays={request.totalDays}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Leave Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-white" />
            <CardTitle>All Leave Requests</CardTitle>
          </div>
          <CardDescription>
            Complete history of leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allRequests.length === 0 ? (
            <div className="text-center py-8">
              <CalendarOff className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No leave requests yet</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {allRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between py-4"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white">
                        {getInitials(request.Employee.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium dark:text-white">{request.Employee.fullName}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {request.leaveType.replace(/_/g, " ")} -{" "}
                        {format(new Date(request.startDate), "MMM d")} to{" "}
                        {format(new Date(request.endDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      request.status === "APPROVED"
                        ? "default"
                        : request.status === "DECLINED"
                        ? "destructive"
                        : request.status === "CANCELLED"
                        ? "secondary"
                        : "outline"
                    }
                    className={
                      request.status === "APPROVED"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : ""
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
