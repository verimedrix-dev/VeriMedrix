import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Mail,
  Server,
  Users,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { getSystemHealth, getRecentErrors } from "@/lib/actions/admin/health";
import { format } from "date-fns";
import Link from "next/link";

export default async function SystemHealthPage() {
  const [health, recentErrors] = await Promise.all([
    getSystemHealth(),
    getRecentErrors(10),
  ]);

  const overallStatus = health.errors.unresolved === 0 && health.emails.successRate >= 95
    ? "healthy"
    : health.errors.unresolved > 10 || health.emails.successRate < 80
    ? "critical"
    : "warning";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Health</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor platform performance and errors
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={
              overallStatus === "healthy"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : overallStatus === "warning"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }
          >
            {overallStatus === "healthy" && <CheckCircle className="h-3 w-3 mr-1" />}
            {overallStatus === "warning" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {overallStatus === "critical" && <XCircle className="h-3 w-3 mr-1" />}
            {overallStatus.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.errors.total24h}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {health.errors.unresolved} unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Success Rate</CardTitle>
            <Mail className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.emails.successRate}%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {health.emails.sent24h} sent / {health.emails.failed24h} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests (24h)</CardTitle>
            <Server className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.api.requests24h.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total API calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.database.users.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registered users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </CardTitle>
            <CardDescription>
              Current record counts across main tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Practices</span>
                <span className="font-semibold">{health.database.practices.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Users</span>
                <span className="font-semibold">{health.database.users.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Documents</span>
                <span className="font-semibold">{health.database.documents.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Tasks</span>
                <span className="font-semibold">{health.database.tasks.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errors by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Errors by Type (24h)
            </CardTitle>
            <CardDescription>
              Most common error types in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {health.errors.byType.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                No errors recorded
              </div>
            ) : (
              <div className="space-y-3">
                {health.errors.byType.map((error) => (
                  <div key={error.errorType} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{error.errorType}</span>
                    <Badge variant="secondary">{error._count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Errors
            </CardTitle>
            <CardDescription>
              Latest error logs from the platform
            </CardDescription>
          </div>
          <Link href="/admin/errors">
            <Button variant="outline" size="sm">
              View All Errors
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              No recent errors
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {recentErrors.map((error) => (
                <div key={error.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={error.resolved ? "outline" : "destructive"}
                          className="shrink-0"
                        >
                          {error.errorType}
                        </Badge>
                        {error.resolved && (
                          <Badge variant="outline" className="text-green-600 shrink-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-900 dark:text-white mt-1 truncate">
                        {error.message}
                      </p>
                      {error.endpoint && (
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          Endpoint: {error.endpoint}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {format(new Date(error.createdAt), "MMM d, HH:mm")}
                      </div>
                      {error.userId && (
                        <p className="text-xs text-slate-400 mt-1">
                          User: {error.userId.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
