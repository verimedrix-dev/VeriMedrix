import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import { getPlatformStats, getSignupTrend } from "@/lib/actions/admin/practices";
import { getSupportTickets } from "@/lib/actions/admin/support";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const [stats, signupTrend, openTickets] = await Promise.all([
    getPlatformStats(),
    getSignupTrend(30),
    getSupportTickets({ status: "OPEN", limit: 5 }),
  ]);

  // Calculate growth
  const totalSignupsLast30Days = signupTrend.reduce((sum, day) => sum + day.count, 0);
  const last7Days = signupTrend.slice(-7).reduce((sum, day) => sum + day.count, 0);
  const previous7Days = signupTrend.slice(-14, -7).reduce((sum, day) => sum + day.count, 0);
  const weeklyGrowth = previous7Days > 0 ? ((last7Days - previous7Days) / previous7Days * 100).toFixed(1) : "N/A";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Platform overview and key metrics
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Total Practices
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.totalPractices}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{stats.newPracticesThisMonth}
              </span>
              <span className="text-slate-500">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Total Users
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {stats.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Active Subscriptions
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-green-600">
              {stats.activePractices}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {stats.trialPractices} on trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Weekly Growth
            </CardDescription>
            <CardTitle className="text-4xl font-bold">
              {weeklyGrowth !== "N/A" ? (
                <span className={Number(weeklyGrowth) >= 0 ? "text-green-600" : "text-red-600"}>
                  {Number(weeklyGrowth) >= 0 ? "+" : ""}{weeklyGrowth}%
                </span>
              ) : (
                "N/A"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {last7Days} signups this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown & Quick Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tier Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Subscription Tiers
            </CardTitle>
            <CardDescription>
              Distribution of practices by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.tierBreakdown).map(([tier, count]) => {
                const percentage = stats.totalPractices > 0 ? (count / stats.totalPractices * 100).toFixed(1) : 0;
                const tierColors: Record<string, string> = {
                  ESSENTIALS: "bg-blue-500",
                  PROFESSIONAL: "bg-purple-500",
                  ENTERPRISE: "bg-amber-500",
                };

                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tier}</span>
                      <span className="text-sm text-slate-500">
                        {count} practices ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tierColors[tier] || "bg-slate-500"} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Signup Trend (30 days)
            </CardTitle>
            <CardDescription>
              {totalSignupsLast30Days} new practices in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end gap-1">
              {signupTrend.slice(-30).map((day, i) => {
                const maxCount = Math.max(...signupTrend.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${day.count} signups`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Open Support Tickets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle>Open Support Tickets</CardTitle>
            </div>
            <Link
              href="/admin/support"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <CardDescription>
            Recent tickets requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {openTickets.tickets.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No open support tickets
            </p>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {openTickets.tickets.map((ticket) => (
                <div key={ticket.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="font-medium text-slate-900 dark:text-white hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {ticket.userEmail} - {format(new Date(ticket.createdAt), "MMM d, HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={ticket.priority === "URGENT" ? "destructive" : ticket.priority === "HIGH" ? "default" : "secondary"}
                    >
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline">{ticket.category}</Badge>
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
