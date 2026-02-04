"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  CalendarOff,
  Target,
  ExternalLink,
  Download,
  XCircle,
  Loader2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LeaveRequestDialog } from "@/components/employees/leave-request-dialog";
import { WarningDialog } from "@/components/employees/warning-dialog";
import { EmployeeDocumentDialog } from "@/components/employees/employee-document-dialog";
import { KpiReviewDialog } from "@/components/employees/kpi-review-dialog";
import { AddKpiGoalDialog } from "@/components/employees/add-kpi-goal-dialog";
import { updateKpiGoal, deleteKpiGoal, deleteEmployeeDocument, deleteWarning } from "@/lib/actions/employees";
import { EmployeeTrainingTab } from "@/components/employees/employee-training-tab";
import { GraduationCap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Training {
  id: string;
  trainingName: string;
  provider: string | null;
  completedDate: Date;
  expiryDate: Date | null;
  status: string;
  score: number | null;
  cpdPoints: number | null;
  certificateUrl: string | null;
  certificateNumber: string | null;
  year: number;
  TrainingModule: {
    id: string;
    name: string;
  } | null;
}

interface TrainingCompliance {
  module: {
    id: string;
    name: string;
  };
  isRequired: boolean;
  isCompleted: boolean;
}

interface EmployeeProfileTabsProps {
  employee: {
    id: string;
    fullName: string;
    annualLeaveBalance: number;
    sickLeaveBalance: number;
    familyLeaveBalance: number;
    documents: Array<{
      id: string;
      title: string;
      documentType: string;
      fileUrl: string;
      fileName?: string | null;
      expiryDate: Date | null;
      isSigned: boolean;
    }>;
    leaveRequests: Array<{
      id: string;
      leaveType: string;
      startDate: Date;
      endDate: Date;
      totalDays: number;
      status: string;
    }>;
    warnings: Array<{
      id: string;
      warningType: string;
      category: string;
      description: string;
      incidentDate: Date;
      issuedAt: Date;
      expiresAt: Date;
      acknowledged: boolean;
      documentUrl?: string | null;
    }>;
    kpiReviews: Array<{
      id: string;
      quarter: number;
      year: number;
      reviewDate: Date | null;
      status: string;
      goals: Array<{
        id: string;
        title: string;
        description: string | null;
        isMet: boolean | null;
        notes: string | null;
      }>;
    }>;
    trainings?: Training[];
    trainingCompliance?: {
      compliance: TrainingCompliance[];
      requiredCompleted: number;
      requiredTotal: number;
      compliancePercentage: number;
    } | null;
    cpdSummary?: {
      year: number;
      totalCpdPoints: number;
      completedCount: number;
      failedCount: number;
      inProgressCount: number;
      totalCount: number;
    } | null;
  };
}

export function EmployeeProfileTabs({ employee }: EmployeeProfileTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deletingWarningId, setDeletingWarningId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);
  const [warningToDelete, setWarningToDelete] = useState<{ id: string; type: string } | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; title: string } | null>(null);
  const now = new Date();

  // Get current quarter and year for KPI display
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();

  const handleMarkGoal = async (goalId: string, isMet: boolean | null) => {
    setUpdatingGoalId(goalId);
    try {
      await updateKpiGoal(goalId, { isMet });
      toast.success(
        isMet === true
          ? "Goal marked as met"
          : isMet === false
          ? "Goal marked as not met"
          : "Goal reset to pending"
      );
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Failed to update goal");
    } finally {
      setUpdatingGoalId(null);
    }
  };

  const handleDeleteGoal = (goalId: string, goalTitle: string) => {
    setGoalToDelete({ id: goalId, title: goalTitle });
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;

    setDeletingGoalId(goalToDelete.id);
    try {
      await deleteKpiGoal(goalToDelete.id);
      toast.success("Goal deleted");
      setGoalToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Failed to delete goal");
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;

    setDeletingDocId(docToDelete.id);
    try {
      await deleteEmployeeDocument(docToDelete.id, employee.id);
      toast.success("Document deleted");
      setDocToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleDeleteWarning = async () => {
    if (!warningToDelete) return;

    setDeletingWarningId(warningToDelete.id);
    try {
      await deleteWarning(warningToDelete.id, employee.id);
      toast.success("Warning record deleted");
      setWarningToDelete(null);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("Failed to delete warning");
    } finally {
      setDeletingWarningId(null);
    }
  };

  return (
    <Tabs defaultValue="kpis" className="space-y-4">
      <TabsList>
        <TabsTrigger value="kpis" className="cursor-pointer">
          <Target className="h-4 w-4 mr-2" />
          KPIs
        </TabsTrigger>
        <TabsTrigger value="training" className="cursor-pointer">
          <GraduationCap className="h-4 w-4 mr-2" />
          Training
        </TabsTrigger>
        <TabsTrigger value="documents" className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="leave" className="cursor-pointer">
          <CalendarOff className="h-4 w-4 mr-2" />
          Leave
        </TabsTrigger>
        <TabsTrigger value="warnings" className="cursor-pointer">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Warnings
        </TabsTrigger>
      </TabsList>

      {/* KPIs Tab */}
      <TabsContent value="kpis">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Performance Goals (KPIs)</CardTitle>
                <CardDescription>
                  Quarterly performance expectations and reviews
                </CardDescription>
              </div>
              <KpiReviewDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
                existingReviews={employee.kpiReviews.map(r => ({ quarter: r.quarter, year: r.year }))}
              />
            </div>
          </CardHeader>
          <CardContent>
            {!employee.kpiReviews || employee.kpiReviews.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No KPI reviews yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Create a quarterly review to set performance goals
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {employee.kpiReviews.map((review) => {
                  const isCurrentQuarter =
                    review.quarter === currentQuarter && review.year === currentYear;
                  const goalsCount = review.goals.length;
                  const metCount = review.goals.filter((g) => g.isMet === true).length;
                  const notMetCount = review.goals.filter((g) => g.isMet === false).length;
                  const pendingCount = review.goals.filter((g) => g.isMet === null).length;

                  return (
                    <div
                      key={review.id}
                      className={`border rounded-lg p-4 ${
                        isCurrentQuarter ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">
                            Q{review.quarter} {review.year}
                          </h4>
                          {isCurrentQuarter && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-white">Current</Badge>
                          )}
                          {review.status !== "DRAFT" && (
                            <Badge
                              variant={
                                review.status === "COMPLETED"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                review.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : ""
                              }
                            >
                              {review.status.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {goalsCount > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600">{metCount} met</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-red-600">{notMetCount} not met</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-500">{pendingCount} pending</span>
                            </div>
                          )}
                          {review.status !== "COMPLETED" && (
                            <AddKpiGoalDialog
                              reviewId={review.id}
                              quarter={review.quarter}
                              year={review.year}
                            />
                          )}
                        </div>
                      </div>

                      {review.goals.length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg">
                          <p className="text-sm text-slate-500">No goals set for this quarter</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Click "Add Goal" above to set performance goals
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {review.goals.map((goal) => {
                            const isUpdating = updatingGoalId === goal.id;
                            const isDeleting = deletingGoalId === goal.id;
                            return (
                              <div
                                key={goal.id}
                                className="flex items-start justify-between py-3 px-3 border rounded-lg bg-slate-50/50"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{goal.title}</p>
                                  {goal.description && (
                                    <p className="text-sm text-slate-500 mt-1">
                                      {goal.description}
                                    </p>
                                  )}
                                  {goal.notes && (
                                    <p className="text-sm text-slate-400 mt-1 italic">
                                      Note: {goal.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4 flex items-center gap-2">
                                  {/* Status Badge */}
                                  {goal.isMet === true && (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Met
                                    </Badge>
                                  )}
                                  {goal.isMet === false && (
                                    <Badge variant="destructive">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Not Met
                                    </Badge>
                                  )}
                                  {goal.isMet === null && (
                                    <Badge variant="secondary">Pending</Badge>
                                  )}

                                  {/* Action Buttons - show if review is not completed */}
                                  {review.status !== "COMPLETED" && (
                                    <div className="flex items-center gap-1 ml-2 border-l pl-2">
                                      {isUpdating ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                      ) : (
                                        <>
                                          {goal.isMet !== true && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                              onClick={() => handleMarkGoal(goal.id, true)}
                                              disabled={isPending}
                                              title="Mark as Met"
                                            >
                                              <CheckCircle className="h-4 w-4" />
                                            </Button>
                                          )}
                                          {goal.isMet !== false && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                              onClick={() => handleMarkGoal(goal.id, false)}
                                              disabled={isPending}
                                              title="Mark as Not Met"
                                            >
                                              <XCircle className="h-4 w-4" />
                                            </Button>
                                          )}
                                          {goal.isMet !== null && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                              onClick={() => handleMarkGoal(goal.id, null)}
                                              disabled={isPending}
                                              title="Reset to Pending"
                                            >
                                              <RotateCcw className="h-4 w-4" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteGoal(goal.id, goal.title)}
                                            disabled={isPending || isDeleting}
                                            title="Delete goal"
                                          >
                                            {isDeleting ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {review.reviewDate && (
                        <p className="text-xs text-slate-400 mt-4">
                          Reviewed: {format(new Date(review.reviewDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Training Tab */}
      <TabsContent value="training">
        <EmployeeTrainingTab
          employeeId={employee.id}
          employeeName={employee.fullName}
          trainings={employee.trainings || []}
          compliance={employee.trainingCompliance || null}
          cpdSummary={employee.cpdSummary || null}
        />
      </TabsContent>

      {/* Documents Tab */}
      <TabsContent value="documents">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employee Documents</CardTitle>
                <CardDescription>
                  Contracts, ID copies, and certificates
                </CardDescription>
              </div>
              <EmployeeDocumentDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
              />
            </div>
          </CardHeader>
          <CardContent>
            {employee.documents?.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">No documents uploaded</p>
              </div>
            ) : (
              <div className="divide-y">
                {employee.documents?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-slate-500">
                          {doc.documentType.replace(/_/g, " ")}
                          {doc.expiryDate &&
                            ` - Expires: ${format(
                              new Date(doc.expiryDate),
                              "MMM d, yyyy"
                            )}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.isSigned && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Signed
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={doc.fileUrl} download={doc.fileName || doc.title}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDocToDelete({ id: doc.id, title: doc.title })}
                        disabled={deletingDocId === doc.id}
                      >
                        {deletingDocId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Leave Tab */}
      <TabsContent value="leave">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leave Management</CardTitle>
                <CardDescription>
                  Leave balances and request history
                </CardDescription>
              </div>
              <LeaveRequestDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
                leaveBalances={{
                  annual: employee.annualLeaveBalance,
                  sick: employee.sickLeaveBalance,
                  family: employee.familyLeaveBalance,
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Leave Balances */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Annual Leave</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-white">
                  {employee.annualLeaveBalance} days
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-300 font-medium">Sick Leave</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-white">
                  {employee.sickLeaveBalance} days
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-300 font-medium">
                  Family Responsibility
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-white">
                  {employee.familyLeaveBalance} days
                </p>
              </div>
            </div>

            {/* Leave History */}
            <h4 className="font-medium mb-3">Leave History</h4>
            {employee.leaveRequests?.length === 0 ? (
              <p className="text-slate-500 text-center py-4">
                No leave requests
              </p>
            ) : (
              <div className="divide-y">
                {employee.leaveRequests?.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="font-medium">
                        {leave.leaveType.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(leave.startDate), "MMM d")} -{" "}
                        {format(new Date(leave.endDate), "MMM d, yyyy")} (
                        {leave.totalDays} days)
                      </p>
                    </div>
                    <Badge
                      variant={
                        leave.status === "APPROVED"
                          ? "default"
                          : leave.status === "DECLINED"
                          ? "destructive"
                          : "secondary"
                      }
                      className={
                        leave.status === "APPROVED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : ""
                      }
                    >
                      {leave.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Warnings Tab */}
      <TabsContent value="warnings">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Disciplinary Record</CardTitle>
                <CardDescription>
                  Warning history and documentation for CCMA compliance
                </CardDescription>
              </div>
              <WarningDialog
                employeeId={employee.id}
                employeeName={employee.fullName}
              />
            </div>
          </CardHeader>
          <CardContent>
            {employee.warnings?.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-300 mb-4" />
                <p className="text-slate-500">No warnings on record</p>
              </div>
            ) : (
              <div className="divide-y">
                {employee.warnings?.map((warning) => {
                  const isExpired = new Date(warning.expiresAt) < now;

                  return (
                    <div key={warning.id} className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              warning.warningType === "FINAL_WRITTEN"
                                ? "destructive"
                                : warning.warningType === "WRITTEN"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {warning.warningType.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline">
                            {warning.category.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {isExpired ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : warning.acknowledged ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Acknowledged
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                            Pending Acknowledgment
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mb-2">
                        {warning.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          Incident: {format(new Date(warning.incidentDate), "MMM d, yyyy")}{" "}
                          | Issued: {format(new Date(warning.issuedAt), "MMM d, yyyy")} |{" "}
                          Expires: {format(new Date(warning.expiresAt), "MMM d, yyyy")}
                        </p>
                        <div className="flex items-center gap-2">
                          {warning.documentUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(warning.documentUrl!, "_blank")}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Document
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setWarningToDelete({ id: warning.id, type: warning.warningType })}
                            disabled={deletingWarningId === warning.id}
                          >
                            {deletingWarningId === warning.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{docToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Warning Confirmation Dialog */}
      <AlertDialog open={!!warningToDelete} onOpenChange={() => setWarningToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Disciplinary Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {warningToDelete?.type.replace(/_/g, " ").toLowerCase()} warning?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWarning}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Goal Confirmation Dialog */}
      <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{goalToDelete?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGoal}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
}
