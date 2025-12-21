import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  ExternalLink,
  Shield,
  Building2,
} from "lucide-react";
import { getAdminUsers } from "@/lib/actions/admin/users";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; isActive?: string }>;
}) {
  const params = await searchParams;
  const { users, total } = await getAdminUsers({
    search: params.search,
    role: params.role as "SUPER_ADMIN" | "PRACTICE_OWNER" | "ADMIN" | "STAFF" | "VIEWER" | "LOCUM" | undefined,
    isActive: params.isActive === "true" ? true : params.isActive === "false" ? false : undefined,
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "PRACTICE_OWNER": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ADMIN": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "STAFF": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {total} users registered
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
              name="role"
              defaultValue={params.role || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="PRACTICE_OWNER">Practice Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="VIEWER">Viewer</option>
              <option value="LOCUM">Locum</option>
            </select>
            <select
              name="isActive"
              defaultValue={params.isActive || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Click on a user to view details and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No users found
            </p>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="block py-4 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role.replace("_", " ")}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                          {user.twoFactorEnabled && (
                            <Badge variant="outline" className="gap-1">
                              <Shield className="h-3 w-3" />
                              2FA
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {user.Practice && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Building2 className="h-4 w-4" />
                            <span>{user.Practice.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {user.Practice.subscriptionTier}
                          </Badge>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-slate-400">joined</p>
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
