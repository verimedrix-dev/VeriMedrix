import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  User,
  Building2,
  Clock,
} from "lucide-react";
import { getAdminAuditLogs } from "@/lib/actions/admin/support";
import { format } from "date-fns";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; practiceId?: string }>;
}) {
  const params = await searchParams;
  const { logs, total } = await getAdminAuditLogs({
    action: params.action,
    practiceId: params.practiceId,
    limit: 100,
  });

  const getActionColor = (action: string) => {
    if (action.includes("SUSPEND") || action.includes("DELETE")) {
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    }
    if (action.includes("ACTIVATE") || action.includes("CREATE")) {
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
    if (action.includes("UPDATE")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Audit Log</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {total} admin actions recorded
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <select
              name="action"
              defaultValue={params.action || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Actions</option>
              <option value="VIEW_PRACTICE">View Practice</option>
              <option value="VIEW_USER">View User</option>
              <option value="IMPERSONATE_USER">Impersonate User</option>
              <option value="UPDATE_SUBSCRIPTION">Update Subscription</option>
              <option value="SUSPEND_PRACTICE">Suspend Practice</option>
              <option value="ACTIVATE_PRACTICE">Activate Practice</option>
              <option value="SUSPEND_USER">Suspend User</option>
              <option value="ACTIVATE_USER">Activate User</option>
              <option value="RESET_PASSWORD">Reset Password</option>
              <option value="RESET_2FA">Reset 2FA</option>
              <option value="UPDATE_CONFIG">Update Config</option>
              <option value="UPDATE_FEATURE_FLAG">Update Feature Flag</option>
              <option value="CREATE_ANNOUNCEMENT">Create Announcement</option>
              <option value="RESPOND_TICKET">Respond Ticket</option>
              <option value="CLOSE_TICKET">Close Ticket</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Activity Log
          </CardTitle>
          <CardDescription>
            All administrative actions are logged here
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No audit logs found
            </p>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {logs.map((log) => (
                <div key={log.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-slate-900 dark:text-white">
                          on {log.entityType}
                        </span>
                        {log.entityId && (
                          <span className="text-sm text-slate-500">
                            ({log.entityId.substring(0, 8)}...)
                          </span>
                        )}
                      </div>
                      {log.practiceId && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                          <Building2 className="h-3 w-3" />
                          Practice: {log.practiceId.substring(0, 8)}...
                        </div>
                      )}
                      {log.details && (
                        <pre className="mt-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <User className="h-3 w-3" />
                        {log.adminId.substring(0, 8)}...
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                      </div>
                      {log.ipAddress && (
                        <p className="text-xs text-slate-400 mt-1">
                          IP: {log.ipAddress}
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
