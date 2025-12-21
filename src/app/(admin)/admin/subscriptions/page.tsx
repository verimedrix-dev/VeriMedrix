import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { getSubscriptionOverview, getSubscriptionsList } from "@/lib/actions/admin/subscriptions";
import { format } from "date-fns";
import Link from "next/link";

export default async function SubscriptionsPage() {
  const [overview, subscriptions] = await Promise.all([
    getSubscriptionOverview(),
    getSubscriptionsList({ limit: 20 }),
  ]);

  const tierColors: Record<string, string> = {
    FREE: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    ESSENTIALS: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    STARTER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PROFESSIONAL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    ENTERPRISE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    TRIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PAST_DUE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    EXPIRED: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    ACTIVE: <CheckCircle className="h-3 w-3" />,
    TRIAL: <Clock className="h-3 w-3" />,
    PAST_DUE: <AlertTriangle className="h-3 w-3" />,
    CANCELLED: <XCircle className="h-3 w-3" />,
    EXPIRED: <XCircle className="h-3 w-3" />,
  };

  // Subscription tier prices
  const tierPrices: Record<string, number> = {
    ESSENTIALS: 1999,
    PROFESSIONAL: 3999,
  };

  const estimatedMRR = overview.byTier.reduce((acc, tier) => {
    const activeCount = overview.byStatus.find(s => s.status === "ACTIVE")?.count || 0;
    const tierRatio = overview.total > 0 ? tier.count / overview.total : 0;
    return acc + (tierPrices[tier.tier] || 0) * Math.round(activeCount * tierRatio);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Subscriptions</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage practice subscriptions and billing
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Practices</CardTitle>
            <Building2 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registered practices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.byStatus.find(s => s.status === "ACTIVE")?.count || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Accounts</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.byStatus.find(s => s.status === "TRIAL")?.count || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              On trial period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{estimatedMRR.toLocaleString()}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription Tiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Tiers
            </CardTitle>
            <CardDescription>
              Distribution of practices by tier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.byTier.length === 0 ? (
              <p className="text-sm text-slate-500">No practices yet</p>
            ) : (
              overview.byTier.map((tier) => (
                <div key={tier.tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={tierColors[tier.tier] || "bg-slate-100"}>
                      {tier.tier}
                    </Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      R{(tierPrices[tier.tier] || 0).toLocaleString()}/month
                    </span>
                  </div>
                  <span className="font-semibold">{tier.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Practices by subscription status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.byStatus.length === 0 ? (
              <p className="text-sm text-slate-500">No practices yet</p>
            ) : (
              overview.byStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <Badge className={`${statusColors[status.status] || "bg-slate-100"} gap-1`}>
                    {statusIcons[status.status]}
                    {status.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="font-semibold">{status.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Practices */}
      {overview.recentPractices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Registered Practices
            </CardTitle>
            <CardDescription>
              Newest practice signups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.recentPractices.map((practice) => (
                <div key={practice.id} className="flex items-center justify-between py-2 border-b dark:border-slate-700 last:border-0">
                  <div>
                    <p className="font-medium">{practice.name}</p>
                    <p className="text-sm text-slate-500">
                      Joined {format(new Date(practice.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={tierColors[practice.subscriptionTier] || "bg-slate-100"}>
                      {practice.subscriptionTier}
                    </Badge>
                    <Badge className={statusColors[practice.subscriptionStatus] || "bg-slate-100"}>
                      {practice.subscriptionStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Subscriptions</CardTitle>
            <CardDescription>
              Manage practice subscriptions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.practices.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              No practices found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b dark:border-slate-700">
                    <th className="pb-3 font-medium">Practice</th>
                    <th className="pb-3 font-medium">Tier</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Users</th>
                    <th className="pb-3 font-medium">Trial Ends</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700">
                  {subscriptions.practices.map((practice) => (
                    <tr key={practice.id}>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{practice.name}</p>
                          <p className="text-sm text-slate-500">{practice.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={tierColors[practice.subscriptionTier] || "bg-slate-100"}>
                          {practice.subscriptionTier}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge className={`${statusColors[practice.subscriptionStatus] || "bg-slate-100"} gap-1`}>
                          {statusIcons[practice.subscriptionStatus]}
                          {practice.subscriptionStatus.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3">{practice.userCount}</td>
                      <td className="py-3">
                        {practice.trialEndsAt
                          ? format(new Date(practice.trialEndsAt), "MMM d, yyyy")
                          : "-"}
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/admin/practices/${practice.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {subscriptions.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-slate-700">
              <p className="text-sm text-slate-500">
                Showing {subscriptions.practices.length} of {subscriptions.total} practices
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={subscriptions.page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={subscriptions.page === subscriptions.totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Gateway Notice */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Payment Gateway Integration</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Connect a payment gateway (Stripe, PayFast, etc.) to enable automated billing,
              invoicing, and subscription management.
            </p>
          </div>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
