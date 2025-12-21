import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  Activity,
  Bell,
} from "lucide-react";
import { getAdminUserById } from "@/lib/actions/admin/users";
import { format } from "date-fns";
import Link from "next/link";
import { UserActions } from "@/components/admin/user-actions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUserById(id);

  if (!user) {
    notFound();
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-red-100 text-red-800";
      case "PRACTICE_OWNER": return "bg-purple-100 text-purple-800";
      case "ADMIN": return "bg-blue-100 text-blue-800";
      case "STAFF": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-2xl font-semibold text-slate-600 dark:text-slate-300">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {user.name}
            </h1>
            <p className="text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getRoleColor(user.role)}>
                {user.role.replace("_", " ")}
              </Badge>
              {!user.isActive && (
                <Badge variant="destructive">Inactive</Badge>
              )}
              {user.twoFactorEnabled && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  2FA Enabled
                </Badge>
              )}
            </div>
          </div>
        </div>
        <UserActions
          userId={user.id}
          currentRole={user.role}
          isActive={user.isActive}
          twoFactorEnabled={user.twoFactorEnabled}
        />
      </div>

      {/* Practice Info */}
      {user.Practice && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Practice</p>
                  <Link
                    href={`/admin/practices/${user.Practice.id}`}
                    className="text-lg font-medium text-slate-900 dark:text-white hover:underline"
                  >
                    {user.Practice.name}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{user.Practice.subscriptionTier}</Badge>
                <Badge variant={user.Practice.subscriptionStatus === "ACTIVE" ? "default" : "secondary"}>
                  {user.Practice.subscriptionStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity ({user.AuditLog.length})</TabsTrigger>
          <TabsTrigger value="notifications">Notifications ({user.Alert.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Joined</p>
                      <p className="font-medium">
                        {format(new Date(user.createdAt), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Two-Factor Auth</p>
                      <p className="font-medium">
                        {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Last 50 actions performed by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.AuditLog.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No activity recorded
                </p>
              ) : (
                <div className="divide-y dark:divide-slate-700">
                  {user.AuditLog.map((log) => (
                    <div key={log.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {log.action} {log.entityType}
                          </p>
                          {log.entityId && (
                            <p className="text-sm text-slate-500">
                              Entity ID: {log.entityId}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">
                            {format(new Date(log.createdAt), "MMM d, HH:mm")}
                          </p>
                          {log.ipAddress && (
                            <p className="text-xs text-slate-400">
                              {log.ipAddress}
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
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
              <CardDescription>
                Last 20 notifications for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.Alert.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No notifications
                </p>
              ) : (
                <div className="divide-y dark:divide-slate-700">
                  {user.Alert.map((alert) => (
                    <div key={alert.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {alert.alertType.replace("_", " ")}
                          </p>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {alert.message}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={alert.status === "SENT" ? "default" : "secondary"}>
                            {alert.status}
                          </Badge>
                          <p className="text-sm text-slate-500 mt-1">
                            {format(new Date(alert.createdAt), "MMM d, HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
