import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building,
} from "lucide-react";
import Link from "next/link";
import { getEmployee } from "@/lib/actions/employees";
import { getEmployeeTrainings, getEmployeeTrainingCompliance, getEmployeeCpdSummary } from "@/lib/actions/training";
import { format } from "date-fns";
import { EmployeeProfileTabs } from "@/components/employees/employee-profile-tabs";
import { DeleteEmployeeDialog } from "@/components/employees/delete-employee-dialog";
import { EditEmployeeDialog } from "@/components/employees/edit-employee-dialog";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch employee and training data in parallel
  const [employee, trainings, compliance, cpdSummary] = await Promise.all([
    getEmployee(id),
    getEmployeeTrainings(id),
    getEmployeeTrainingCompliance(id),
    getEmployeeCpdSummary(id),
  ]);

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-medium">
              {getInitials(employee.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {employee.fullName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {employee.position}
              {employee.department && ` - ${employee.department}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {employee.isActive ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
          <Badge variant="outline">{employee.employmentType}</Badge>
          <EditEmployeeDialog
            employeeId={employee.id}
            currentEmail={employee.email}
            currentPhone={employee.phone}
          />
          <DeleteEmployeeDialog
            employeeId={employee.id}
            employeeName={employee.fullName}
          />
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {employee.email && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                  <p className="text-sm font-medium dark:text-white">{employee.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {employee.phone && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                  <p className="text-sm font-medium dark:text-white">{employee.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {employee.hireDate && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Hire Date</p>
                  <p className="text-sm font-medium dark:text-white">
                    {format(new Date(employee.hireDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {employee.employeeNumber && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Employee #</p>
                  <p className="text-sm font-medium dark:text-white">{employee.employeeNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs - Client Component for interactivity */}
      <EmployeeProfileTabs
        employee={{
          id: employee.id,
          fullName: employee.fullName,
          annualLeaveBalance: employee.annualLeaveBalance,
          sickLeaveBalance: employee.sickLeaveBalance,
          familyLeaveBalance: employee.familyLeaveBalance,
          documents: employee.EmployeeDocument || [],
          leaveRequests: employee.LeaveRequest || [],
          warnings: employee.Warning || [],
          kpiReviews: (employee.KpiReview || []).map(review => ({
            ...review,
            goals: review.goals || [],
          })),
          trainings: trainings,
          trainingCompliance: compliance ? {
            compliance: compliance.compliance.map(c => ({
              module: c.module,
              isRequired: c.isRequired,
              isCompleted: c.isCompleted,
            })),
            requiredCompleted: compliance.requiredCompleted,
            requiredTotal: compliance.requiredTotal,
            compliancePercentage: compliance.compliancePercentage,
          } : null,
          cpdSummary: cpdSummary ? {
            year: cpdSummary.year,
            totalCpdPoints: cpdSummary.totalCpdPoints,
            completedCount: cpdSummary.completedCount,
            failedCount: cpdSummary.failedCount,
            inProgressCount: cpdSummary.inProgressCount,
            totalCount: cpdSummary.totalCount,
          } : null,
        }}
      />
    </div>
  );
}
