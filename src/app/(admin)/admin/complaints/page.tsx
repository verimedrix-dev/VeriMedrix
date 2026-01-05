import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Timer,
  Target,
} from "lucide-react";
import { getComplaintsOverview } from "@/lib/actions/admin/complaints";

function getStatusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-blue-500";
    case "UNDER_INVESTIGATION":
      return "bg-purple-500";
    case "PENDING_RESPONSE":
      return "bg-amber-500";
    case "RESOLVED":
      return "bg-green-500";
    case "CLOSED":
      return "bg-slate-500";
    default:
      return "bg-slate-400";
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "SERVICE_QUALITY":
      return "bg-blue-500";
    case "WAIT_TIME":
      return "bg-amber-500";
    case "STAFF_CONDUCT":
      return "bg-purple-500";
    case "BILLING":
      return "bg-green-500";
    case "CLINICAL_CARE":
      return "bg-red-500";
    case "FACILITY":
      return "bg-cyan-500";
    case "COMMUNICATION":
      return "bg-indigo-500";
    default:
      return "bg-slate-400";
  }
}

function formatCategoryName(category: string): string {
  return category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

export default async function AdminComplaintsPage() {
  const data = await getComplaintsOverview();

  const maxMonthCount = Math.max(...data.monthlyTrend.map(m => m.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Complaints Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Platform-wide complaint metrics and trends
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
            <MessageSquare className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All time across platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.last30Days}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +{data.summary.last7Days} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.open}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Awaiting resolution
            </p>
          </CardContent>
        </Card>

        <Card className={data.summary.overdueAcknowledgement > 0 ? "border-amber-200 dark:border-amber-800" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Ack.</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${data.summary.overdueAcknowledgement > 0 ? "text-amber-500" : "text-slate-400"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.overdueAcknowledgement > 0 ? "text-amber-600" : ""}`}>
              {data.summary.overdueAcknowledgement}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Not acknowledged in 5 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ack. Compliance</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.compliance.acknowledgementRate}%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Within 5 day SLA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Acknowledgement Rate</p>
                <p className="text-2xl font-bold">{data.compliance.acknowledgementRate}%</p>
                <p className="text-xs text-slate-500">of complaints acknowledged within 5 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Timer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Resolution Time</p>
                <p className="text-2xl font-bold">{data.compliance.avgResolutionDays} days</p>
                <p className="text-xs text-slate-500">from received to resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg. per Practice</p>
                <p className="text-2xl font-bold">{data.compliance.avgComplaintsPerPractice}</p>
                <p className="text-xs text-slate-500">complaints per practice</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Status Breakdown
            </CardTitle>
            <CardDescription>
              Complaints by current status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.byStatus.length > 0 ? (
              data.byStatus.map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                      <span>{item.status.replace(/_/g, " ")}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <Progress
                    value={(item.count / data.summary.total) * 100}
                    className="h-2"
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No complaints yet</p>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              Complaints by category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.byCategory.length > 0 ? (
              data.byCategory.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(item.category)}`} />
                      <span>{formatCategoryName(item.category)}</span>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <Progress
                    value={(item.count / data.summary.total) * 100}
                    className="h-2"
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No complaints yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Trend
          </CardTitle>
          <CardDescription>
            Complaints received and resolved over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center gap-4">
                <span className="w-12 text-sm text-slate-500 font-medium">{month.month}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full flex items-center justify-end pr-2"
                      style={{ width: `${(month.count / maxMonthCount) * 100}%` }}
                    >
                      {month.count > 0 && (
                        <span className="text-xs text-white font-medium">{month.count}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-24 text-right">
                  <Badge variant={month.resolved === month.count ? "default" : "secondary"} className="text-xs">
                    {month.resolved}/{month.count} resolved
                  </Badge>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 pt-2 border-t">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                Total Complaints
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This overview shows aggregate complaint metrics across all practices. Individual complaint details
                remain private to each practice. Metrics help identify platform-wide trends and compliance rates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
