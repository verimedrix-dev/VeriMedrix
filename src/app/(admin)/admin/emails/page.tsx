import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { getEmailTemplates, getEmailLogs } from "@/lib/actions/admin/support";
import { format } from "date-fns";

export default async function EmailsPage() {
  const [templates, { emails: recentEmails }] = await Promise.all([
    getEmailTemplates(),
    getEmailLogs({ limit: 50 }),
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Email Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage email templates and view email logs
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Configure email templates used by the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No email templates configured yet.
                </div>
              ) : (
                <div className="divide-y dark:divide-slate-700">
                  {templates.map((template) => (
                    <div key={template.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900 dark:text-white">
                              {template.name}
                            </span>
                            {template.isActive ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            Subject: {template.subject}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit Template
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Recent Email Activity
              </CardTitle>
              <CardDescription>
                View recent emails sent by the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentEmails.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No emails sent yet.
                </div>
              ) : (
                <div className="divide-y dark:divide-slate-700">
                  {recentEmails.map((email) => (
                    <div key={email.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(email.status)}
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {email.subject}
                            </span>
                            <Badge className={getStatusColor(email.status)}>
                              {email.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 truncate">
                            To: {email.toEmail}
                          </p>
                          {email.errorMessage && (
                            <p className="text-sm text-red-500 mt-1 truncate">
                              Error: {email.errorMessage}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {format(new Date(email.createdAt), "MMM d, HH:mm")}
                          </div>
                          {email.templateId && (
                            <p className="text-xs text-slate-400 mt-1">
                              Template: {email.templateId}
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
      </Tabs>
    </div>
  );
}
