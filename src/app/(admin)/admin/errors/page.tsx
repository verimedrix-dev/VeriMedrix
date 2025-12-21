import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
} from "lucide-react";
import { getErrorLogs } from "@/lib/actions/admin/support";
import { format } from "date-fns";
import { ErrorActions } from "@/components/admin/error-actions";

export default async function ErrorLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ errorType?: string; resolved?: string }>;
}) {
  const params = await searchParams;
  const { errors, total } = await getErrorLogs({
    errorType: params.errorType,
    resolved: params.resolved === "true" ? true : params.resolved === "false" ? false : undefined,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Error Logs</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {total} errors recorded
          </p>
        </div>
        <ErrorActions />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-wrap gap-4">
            <select
              name="resolved"
              defaultValue={params.resolved || ""}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">All Status</option>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
            </select>
            <input
              type="text"
              name="errorType"
              placeholder="Error type..."
              defaultValue={params.errorType || ""}
              className="px-3 py-2 border rounded-md bg-background"
            />
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Log
          </CardTitle>
          <CardDescription>
            All platform errors with stack traces and context
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              No errors found
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {errors.map((error) => (
                <div key={error.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={error.resolved ? "outline" : "destructive"}
                        >
                          {error.errorType}
                        </Badge>
                        {error.resolved ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Unresolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white mt-2">
                        {error.message}
                      </p>
                      {error.errorCode && (
                        <p className="text-xs text-slate-500 mt-1">
                          Error Code: {error.errorCode}
                        </p>
                      )}
                      {error.stack && (
                        <pre className="mt-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded overflow-x-auto max-h-32">
                          {error.stack}
                        </pre>
                      )}
                      {error.context && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer">
                            View context
                          </summary>
                          <pre className="mt-1 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded overflow-x-auto">
                            {JSON.stringify(error.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {format(new Date(error.createdAt), "MMM d, HH:mm:ss")}
                      </div>
                      {error.userId && (
                        <p className="text-xs text-slate-400 mt-1">
                          User: {error.userId.substring(0, 8)}...
                        </p>
                      )}
                      {error.practiceId && (
                        <p className="text-xs text-slate-400 mt-1">
                          Practice: {error.practiceId.substring(0, 8)}...
                        </p>
                      )}
                      {error.resolvedAt && (
                        <p className="text-xs text-green-600 mt-2">
                          Resolved: {format(new Date(error.resolvedAt), "MMM d, HH:mm")}
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
