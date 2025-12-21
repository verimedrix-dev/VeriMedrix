import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  FileText,
  Search,
  ExternalLink,
} from "lucide-react";
import { getAdminPractices } from "@/lib/actions/admin/practices";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminPracticesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tier?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { practices, total } = await getAdminPractices({
    search: params.search,
    tier: params.tier as "ESSENTIALS" | "PROFESSIONAL" | "ENTERPRISE" | undefined,
    status: params.status as "TRIAL" | "ACTIVE" | "CANCELLED" | "PAST_DUE" | undefined,
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "PROFESSIONAL": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ENTERPRISE": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "TRIAL": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "PAST_DUE": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Practices</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {total} practices registered
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  name="search"
                  placeholder="Search by name or email..."
                  defaultValue={params.search}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              name="tier"
              defaultValue={params.tier || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Tiers</option>
              <option value="ESSENTIALS">Essentials</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select
              name="status"
              defaultValue={params.status || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="PAST_DUE">Past Due</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Practices List */}
      <Card>
        <CardHeader>
          <CardTitle>All Practices</CardTitle>
          <CardDescription>
            Click on a practice to view details and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {practices.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No practices found
            </p>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {practices.map((practice) => (
                <Link
                  key={practice.id}
                  href={`/admin/practices/${practice.id}`}
                  className="block py-4 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {practice.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {practice.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTierColor(practice.subscriptionTier)}>
                            {practice.subscriptionTier}
                          </Badge>
                          <Badge className={getStatusColor(practice.subscriptionStatus)}>
                            {practice.subscriptionStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Users className="h-4 w-4" />
                          <span>{practice._count.User}</span>
                        </div>
                        <p className="text-xs text-slate-400">users</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <FileText className="h-4 w-4" />
                          <span>{practice._count.Document}</span>
                        </div>
                        <p className="text-xs text-slate-400">docs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          {format(new Date(practice.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-slate-400">created</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
