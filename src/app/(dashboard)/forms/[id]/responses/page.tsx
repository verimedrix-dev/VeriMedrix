import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getCustomForm, getFormResponses, FormField } from "@/lib/actions/forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Calendar, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

interface ResponsesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  await requirePermission(PERMISSIONS.LOGBOOK);
  const { id } = await params;

  const [form, { responses, total }] = await Promise.all([
    getCustomForm(id),
    getFormResponses(id),
  ]);

  if (!form) {
    notFound();
  }

  const fields = form.fields as FormField[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Form Responses</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {form.name} - {total} response{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link href={`/forms/${id}/fill`}>
          <Button>Fill Form</Button>
        </Link>
      </div>

      {/* Responses */}
      {responses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No responses yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                This form hasn&apos;t received any submissions yet.
              </p>
              <Link href={`/forms/${id}/fill`}>
                <Button>Fill Form</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => {
            const responseData = response.responses as Record<string, string | number | boolean>;
            return (
              <Card key={response.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(response.submittedAt), "dd MMM yyyy HH:mm")}
                      </span>
                      {response.SubmittedBy?.name && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {response.SubmittedBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((field) => {
                      const value = responseData[field.id];
                      return (
                        <div key={field.id} className="space-y-1">
                          <p className="text-sm font-medium text-slate-500">{field.label}</p>
                          <p className="text-slate-900 dark:text-white">
                            {field.type === "checkbox" ? (
                              <Badge variant={value ? "default" : "secondary"}>
                                {value ? "Yes" : "No"}
                              </Badge>
                            ) : value !== undefined && value !== "" ? (
                              String(value)
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
