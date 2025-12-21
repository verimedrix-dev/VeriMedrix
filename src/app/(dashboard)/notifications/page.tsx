import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { ensureUserAndPractice } from "@/lib/actions/practice";
import {
  Bell,
  FileText,
  CheckSquare,
  AlertTriangle,
  Clock,
  Calendar,
  CalendarCheck,
  CalendarX,
  AlertCircle,
  GraduationCap,
  Award,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";

export default async function NotificationsPage() {
  const { user, practice } = await ensureUserAndPractice();

  // Get alerts for the current user (not all practice alerts)
  const alerts = user ? await prisma.alert.findMany({
    where: { recipientId: user.id },
    include: {
      Document: true,
      Task: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50
  }) : [];

  const unreadCount = alerts.filter(a => a.status === "PENDING").length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "DOCUMENT_EXPIRY": return <FileText className="h-5 w-5 text-amber-500" />;
      case "TASK_OVERDUE": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "TASK_REMINDER": return <Clock className="h-5 w-5 text-blue-500" />;
      case "TASK_ASSIGNED": return <CheckSquare className="h-5 w-5 text-green-500" />;
      case "ESCALATION": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "LEAVE_REQUEST": return <Calendar className="h-5 w-5 text-purple-500" />;
      case "LEAVE_APPROVED": return <CalendarCheck className="h-5 w-5 text-green-500" />;
      case "LEAVE_DECLINED": return <CalendarX className="h-5 w-5 text-red-500" />;
      case "WARNING_ISSUED": return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "TRAINING_EXPIRY": return <GraduationCap className="h-5 w-5 text-amber-500" />;
      case "REGISTRATION_EXPIRY": return <Award className="h-5 w-5 text-amber-500" />;
      default: return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "DOCUMENT_EXPIRY": return "Document Expiry";
      case "TASK_OVERDUE": return "Task Overdue";
      case "TASK_REMINDER": return "Task Reminder";
      case "TASK_ASSIGNED": return "Task Assigned";
      case "ESCALATION": return "Escalation";
      case "LEAVE_REQUEST": return "Leave Request";
      case "LEAVE_APPROVED": return "Leave Approved";
      case "LEAVE_DECLINED": return "Leave Declined";
      case "WARNING_ISSUED": return "Warning";
      case "TRAINING_EXPIRY": return "Training Expiry";
      case "REGISTRATION_EXPIRY": return "Registration Expiry";
      default: return type.replace(/_/g, " ");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT": return <Badge variant="secondary" className="text-xs">Read</Badge>;
      case "PENDING": return <Badge variant="default" className="text-xs">New</Badge>;
      case "FAILED": return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : "You're all caught up!"}
          </p>
        </div>
        {user && unreadCount > 0 && (
          <MarkAllReadButton userId={user.id} />
        )}
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`hover:shadow-md transition-shadow ${
              alert.status === "PENDING" ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""
            }`}
          >
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getAlertIcon(alert.alertType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getAlertTypeLabel(alert.alertType)}
                    </Badge>
                    {getStatusBadge(alert.status)}
                  </div>
                  <p className="text-slate-900 dark:text-white">{alert.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {alerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No notifications</h3>
              <p className="text-slate-600 dark:text-slate-400">
                You&apos;re all caught up! Notifications about leave requests, document expiries, and tasks will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
