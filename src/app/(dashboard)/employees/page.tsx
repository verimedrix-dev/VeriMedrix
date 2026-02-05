import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  Users,
  CalendarOff,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getEmployeesListData } from "@/lib/actions/employees";
import { requirePermission, checkPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

// Dynamic import for dialog - not needed on initial render
const AddEmployeeDialog = dynamic(
  () => import("@/components/employees/add-employee-dialog").then((mod) => mod.AddEmployeeDialog),
  {
    loading: () => <Skeleton className="h-10 w-36" />,
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

export default async function EmployeesPage() {
  // Check if user can view employees
  await requirePermission(PERMISSIONS.EMPLOYEES);

  // Check if user can add/edit employees (for conditional UI)
  const canEditEmployees = await checkPermission(PERMISSIONS.EMPLOYEES_FULL);

  const { employees, stats } = await getEmployeesListData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Employees</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage staff records, registrations, and compliance
          </p>
        </div>
        {canEditEmployees && <AddEmployeeDialog />}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600 dark:text-white" />
              Total Employees
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats?.active || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Pending Leave
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {stats?.pendingLeave || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              Active Warnings
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-red-600 dark:text-red-400">
              {stats?.activeWarnings || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              Total Records
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-slate-600 dark:text-slate-300">
              {stats?.total || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All employees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>
            Click on an employee to view their full profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No employees yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {canEditEmployees
                  ? "Start by adding your first employee to the system."
                  : "No employees have been added to the system yet."
                }
              </p>
              {canEditEmployees && <AddEmployeeDialog />}
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {employees.map((employee) => {
                const activeWarnings = employee._count?.Warning || 0;
                const pendingLeave = employee._count?.LeaveRequest || 0;

                return (
                  <Link
                    key={employee.id}
                    href={`/employees/${employee.id}`}
                    prefetch={true}
                    className="flex items-center justify-between py-4 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white font-medium">
                          {getInitials(employee.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {employee.fullName}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {employee.position}
                          {employee.department && ` - ${employee.department}`}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {employee.employmentType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeWarnings > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {activeWarnings} Warning{activeWarnings > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {pendingLeave > 0 && (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 gap-1">
                          <Clock className="h-3 w-3" />
                          Leave Pending
                        </Badge>
                      )}
                      {!employee.isActive && (
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
