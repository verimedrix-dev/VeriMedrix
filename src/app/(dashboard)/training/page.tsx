import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { getTrainingPageData, getEmployeesTrainingOverview } from "@/lib/actions/training";
import { getEmployeesBasic } from "@/lib/actions/employees";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { TrainingModulesList } from "@/components/training/training-modules-list";
import { EmployeeComplianceTable } from "@/components/training/employee-compliance-table";

// Dynamic imports for dialogs - not needed on initial render
const AddTrainingModuleDialog = dynamic(
  () => import("@/components/training/add-training-module-dialog").then((mod) => mod.AddTrainingModuleDialog),
  {
    loading: () => <Skeleton className="h-10 w-36" />,
  }
);

const RecordTrainingDialog = dynamic(
  () => import("@/components/training/record-training-dialog").then((mod) => mod.RecordTrainingDialog),
  {
    loading: () => <Skeleton className="h-10 w-36" />,
  }
);

const PositionRequirementsDialog = dynamic(
  () => import("@/components/training/position-requirements-dialog").then((mod) => mod.PositionRequirementsDialog),
  {
    loading: () => <Skeleton className="h-9 w-24" />,
  }
);

export default async function TrainingPage() {
  await requirePermission(PERMISSIONS.TRAINING);

  const [pageData, employeesCompliance, employees] = await Promise.all([
    getTrainingPageData(),
    getEmployeesTrainingOverview(),
    getEmployeesBasic({ isActive: true }),
  ]);

  if (!pageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Unable to load training data</p>
      </div>
    );
  }

  const { modules, positions, positionRequirements, recentTrainings, stats } = pageData;
  const now = new Date();
  const currentYear = now.getFullYear();

  // Prepare modules list for dialogs
  const activeModules = modules.filter(m => m.isActive);
  const modulesList = activeModules.map(m => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    cpdPoints: m.cpdPoints,
    validityMonths: m.validityMonths,
    isRequired: m.isRequired,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Training & CPD
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage continuous professional development and staff training compliance
          </p>
        </div>
        <div className="flex gap-3">
          <RecordTrainingDialog
            employees={employees.map(e => ({ id: e.id, fullName: e.fullName, position: e.position }))}
            modules={modulesList}
          />
          <AddTrainingModuleDialog />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Training Modules
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.activeModules}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active training programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
              Completed {currentYear}
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600 dark:text-green-400">
              {stats.completedThisYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Training completions this year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              CPD Points {currentYear}
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalCpdPointsThisYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total points earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Expiring Soon
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-amber-600 dark:text-amber-400">
              {stats.expiringRecords}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Within 90 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="compliance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compliance">Staff Compliance</TabsTrigger>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="requirements">Position Requirements</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Staff Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle>Staff Training Compliance</CardTitle>
              </div>
              <CardDescription>
                Track which employees have completed their required training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeComplianceTable employees={employeesCompliance} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <CardTitle>Training Modules</CardTitle>
                </div>
                <AddTrainingModuleDialog />
              </div>
              <CardDescription>
                Define the trainings and certifications staff need to complete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingModulesList modules={modules} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Position Requirements Tab */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Training Requirements by Position</CardTitle>
              <CardDescription>
                Configure which trainings are required for each role
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">
                    No positions found. Add employees first.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position) => {
                    const requirements = positionRequirements[position] || [];
                    const currentRequirementIds = requirements.map(r => r.trainingModuleId);

                    return (
                      <div
                        key={position}
                        className="flex items-center justify-between p-4 rounded-lg border dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {position}
                          </h4>
                          {requirements.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {requirements.map((req) => (
                                <Badge
                                  key={req.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {req.TrainingModule.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              No training requirements set
                            </p>
                          )}
                        </div>
                        <PositionRequirementsDialog
                          position={position}
                          modules={modulesList}
                          currentRequirements={currentRequirementIds}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Training Activity</CardTitle>
              <CardDescription>
                Latest training completions and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrainings.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No training records yet
                  </p>
                </div>
              ) : (
                <div className="divide-y dark:divide-slate-700">
                  {recentTrainings.map((training) => {
                    const isExpired = training.expiryDate && new Date(training.expiryDate) < now;
                    const isExpiringSoon = training.expiryDate &&
                      !isExpired &&
                      differenceInDays(new Date(training.expiryDate), now) <= 30;

                    return (
                      <div key={training.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/employees/${training.Employee.id}`}
                              className="font-medium text-slate-900 dark:text-white hover:underline"
                            >
                              {training.Employee.fullName}
                            </Link>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {training.trainingName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                Completed: {format(new Date(training.completedDate), "MMM d, yyyy")}
                              </span>
                              {training.cpdPoints && (
                                <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                  {training.cpdPoints} CPD
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {training.status === "COMPLETED" && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                Passed
                              </Badge>
                            )}
                            {training.status === "FAILED" && (
                              <Badge variant="destructive">Failed</Badge>
                            )}
                            {training.status === "IN_PROGRESS" && (
                              <Badge variant="secondary">In Progress</Badge>
                            )}
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                            {isExpiringSoon && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs">
                                Expires {differenceInDays(new Date(training.expiryDate!), now)} days
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
