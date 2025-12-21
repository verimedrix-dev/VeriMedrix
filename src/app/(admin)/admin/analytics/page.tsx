import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Building2,
  FileText,
  CheckSquare,
  TrendingUp,
  Award,
} from "lucide-react";
import { getAnalyticsDashboard, getGrowthMetrics, getUsageMetrics } from "@/lib/actions/admin/analytics";

export default async function AnalyticsPage() {
  const [analytics, growth, usage] = await Promise.all([
    getAnalyticsDashboard(),
    getGrowthMetrics(),
    getUsageMetrics(),
  ]);

  const tierColors: Record<string, string> = {
    FREE: "bg-slate-500",
    STARTER: "bg-blue-500",
    PROFESSIONAL: "bg-purple-500",
    ENTERPRISE: "bg-amber-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Platform usage and growth metrics
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.total.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +{analytics.users.new30d} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Practices</CardTitle>
            <Building2 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.practices.active}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              of {analytics.practices.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.documents.total.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +{analytics.documents.uploaded30d} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.tasks.completed30d.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              in last 30 days ({analytics.tasks.overdue} overdue)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Subscription Distribution
            </CardTitle>
            <CardDescription>
              Practices by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.practices.byTier.map((tier) => (
              <div key={tier.tier} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${tierColors[tier.tier] || "bg-slate-400"}`} />
                    <span>{tier.tier}</span>
                  </div>
                  <span className="font-medium">{tier.count}</span>
                </div>
                <Progress
                  value={(tier.count / analytics.practices.total) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Roles Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Roles Distribution
            </CardTitle>
            <CardDescription>
              Users by role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.users.byRole.map((role) => (
              <div key={role.role} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{role.role.replace(/_/g, " ")}</span>
                  <span className="font-medium">{role.count}</span>
                </div>
                <Progress
                  value={(role.count / analytics.users.total) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Growth
            </CardTitle>
            <CardDescription>
              New signups over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {growth.signupsByMonth.map((month) => (
                <div key={month.month} className="flex items-center gap-4">
                  <span className="w-12 text-sm text-slate-500">{month.month}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${(month.practices / Math.max(...growth.signupsByMonth.map((m) => m.practices + m.users), 1)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-green-500 h-full"
                        style={{
                          width: `${(month.users / Math.max(...growth.signupsByMonth.map((m) => m.practices + m.users), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 w-20 text-right">
                      {month.practices}p / {month.users}u
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  Practices
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  Users
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Status Breakdown
            </CardTitle>
            <CardDescription>
              Documents by current status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.documents.byStatus.map((status) => {
              const statusColors: Record<string, string> = {
                CURRENT: "bg-green-500",
                EXPIRING_SOON: "bg-yellow-500",
                EXPIRED: "bg-red-500",
                DRAFT: "bg-slate-400",
                PENDING_REVIEW: "bg-blue-500",
              };
              return (
                <div key={status.status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status.status] || "bg-slate-400"}`} />
                      <span>{status.status.replace(/_/g, " ")}</span>
                    </div>
                    <span className="font-medium">{status.count}</span>
                  </div>
                  <Progress
                    value={(status.count / analytics.documents.total) * 100}
                    className="h-2"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Most Active Practices
          </CardTitle>
          <CardDescription>
            Top practices by user count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-500 border-b dark:border-slate-700">
                  <th className="pb-3 font-medium">Practice</th>
                  <th className="pb-3 font-medium text-center">Users</th>
                  <th className="pb-3 font-medium text-center">Documents</th>
                  <th className="pb-3 font-medium text-center">Tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {usage.topPractices.map((practice, index) => (
                  <tr key={practice.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm w-6">#{index + 1}</span>
                        <span className="font-medium">{practice.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">{practice.users}</td>
                    <td className="py-3 text-center">{practice.documents}</td>
                    <td className="py-3 text-center">{practice.tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Document Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Most Used Document Types
          </CardTitle>
          <CardDescription>
            Document types by upload count
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usage.topDocumentTypes.map((docType, index) => (
              <div key={docType.id} className="flex items-center gap-4">
                <span className="text-slate-400 text-sm w-6">#{index + 1}</span>
                <span className="flex-1 font-medium">{docType.name}</span>
                <Badge variant="secondary">{docType.count} docs</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
