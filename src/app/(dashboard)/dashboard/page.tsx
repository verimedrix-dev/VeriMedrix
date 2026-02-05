import nextDynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Calendar,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/lib/actions/dashboard";
import { getCurrentUserWithRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format, differenceInDays } from "date-fns";

export const dynamic = "force-dynamic";

// Dynamic import for dialog - not needed on initial render
const UploadDocumentDialog = nextDynamic(
  () => import("@/components/documents/upload-dialog").then((mod) => mod.UploadDocumentDialog),
  {
    loading: () => <Skeleton className="h-10 w-40" />,
  }
);

export default async function DashboardPage() {
  // Redirect locum users to their profile page
  const user = await getCurrentUserWithRole();
  if (user?.role === "LOCUM") {
    redirect("/locum-profile");
  }

  // Optimized: Single auth call + parallel DB queries instead of 4 separate calls
  const data = await getDashboardData();
  const docStats = data?.docStats;
  const taskStats = data?.taskStats;
  const documents = data?.documents || [];
  const tasks = data?.tasks || [];

  // Calculate compliance score based on documents
  const totalRequired = 51; // Based on OHSC requirements
  const currentDocuments = docStats?.current || 0;
  const complianceScore = Math.round((currentDocuments / totalRequired) * 100);

  // Get expiring documents (next 90 days)
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expiringDocuments = documents
    .filter(doc => {
      if (!doc.expiryDate) return false;
      const expiry = new Date(doc.expiryDate);
      return expiry > now && expiry <= ninetyDaysFromNow;
    })
    .map(doc => ({
      ...doc,
      daysLeft: differenceInDays(new Date(doc.expiryDate!), now)
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // Get expired documents
  const expiredDocuments = documents
    .filter(doc => {
      if (!doc.expiryDate) return false;
      return new Date(doc.expiryDate) < now;
    })
    .map(doc => ({
      ...doc,
      daysOverdue: differenceInDays(now, new Date(doc.expiryDate!))
    }))
    .slice(0, 3);

  // Get pending tasks
  const pendingTasks = tasks
    .filter(t => t.status === "PENDING" || t.status === "OVERDUE")
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Compliance Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Welcome back. Here&apos;s your compliance overview.
          </p>
        </div>
        <div className="flex gap-3">
          <UploadDocumentDialog />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Score</CardDescription>
            <CardTitle className="text-4xl font-bold">
              {complianceScore}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={complianceScore} className="h-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {docStats?.total || 0} of {totalRequired} documents uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Current Documents
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600">
              {docStats?.current || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Valid and up to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Expiring Soon
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-amber-600">
              {docStats?.expiringSoon || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Tasks Due
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-red-600">
              {(taskStats?.pending || 0) + (taskStats?.overdue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {taskStats?.overdue || 0} overdue, {taskStats?.pending || 0} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expired Documents - Urgent */}
        {expiredDocuments.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-900">Expired Documents</CardTitle>
                </div>
                <Badge variant="destructive">{expiredDocuments.length} Urgent</Badge>
              </div>
              <CardDescription className="text-red-700">
                These documents have expired and need immediate renewal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                        <p className="text-sm text-red-600">
                          Expired {doc.daysOverdue} days ago
                        </p>
                      </div>
                    </div>
                    <Link href="/documents">
                      <Button size="sm" variant="destructive">
                        Renew Now
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expiring Soon */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                <CardTitle>Expiring Soon</CardTitle>
              </div>
              <Link href="/documents">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              Documents expiring in the next 90 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiringDocuments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No documents expiring soon
              </p>
            ) : (
              <div className="space-y-3">
                {expiringDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{doc.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Expires: {format(new Date(doc.expiryDate!), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={doc.daysLeft <= 30 ? "destructive" : "secondary"}
                      className={doc.daysLeft <= 30 ? "" : "bg-amber-100 text-amber-800"}
                    >
                      {doc.daysLeft} days
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-white" />
                <CardTitle>Pending Tasks</CardTitle>
              </div>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>
              Tasks that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No pending tasks. Great job!
              </p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded border-2 border-slate-300" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                          {task.dueTime && ` at ${task.dueTime}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={task.status === "OVERDUE" ? "destructive" : "secondary"}
                    >
                      {task.status === "OVERDUE" ? "Overdue" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common compliance management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/documents">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Upload className="h-5 w-5 mr-2 text-blue-600 dark:text-white" />
                  <div className="text-left">
                    <p className="font-medium">Upload Document</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Add new compliance doc</p>
                  </div>
                </Button>
              </Link>
              <Link href="/documents">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Document Cabinet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">View all documents</p>
                  </div>
                </Button>
              </Link>
              <Link href="/tasks">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium">Task Manager</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">View compliance tasks</p>
                  </div>
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Calendar className="h-5 w-5 mr-2 text-amber-600" />
                  <div className="text-left">
                    <p className="font-medium">Calendar</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">View schedule</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
