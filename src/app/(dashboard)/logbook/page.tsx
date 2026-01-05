import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { getLogbookData } from "@/lib/actions/tasks";
import { LogbookTaskList } from "@/components/logbook/logbook-task-list";
import { CreateTemplateDialog } from "@/components/logbook/create-template-dialog";

export default async function LogbookPage() {
  const data = await getLogbookData();
  const tasks = data?.tasks || [];
  const templates = data?.templates || [];
  const stats = data?.stats;

  const completionRate = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Daily Logbook</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Log your daily compliance tasks with photo evidence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
          </div>
          <CreateTemplateDialog />
        </div>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Today&apos;s Progress
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {stats?.completed || 0} of {stats?.total || 0} tasks completed
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {completionRate}%
              </span>
            </div>
          </div>
          <Progress value={completionRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <ClipboardCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700 dark:text-white">{stats?.total || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats?.completed || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats?.pending || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats?.overdue || 0}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Templates Info */}
      {templates.length === 0 && tasks.length === 0 && (
        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Set up your recurring tasks
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Create task templates for things like bathroom cleaning, temperature checks, or stock counts.
                  These will automatically appear in your daily logbook.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Summary */}
      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Active Task Templates
              <Badge variant="secondary">{templates.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Badge
                  key={template.id}
                  variant="outline"
                  className="py-1.5"
                >
                  {template.name}
                  {template.requiresEvidence && (
                    <span className="ml-1 text-xs text-slate-400">📷</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <LogbookTaskList tasks={tasks} />
    </div>
  );
}
