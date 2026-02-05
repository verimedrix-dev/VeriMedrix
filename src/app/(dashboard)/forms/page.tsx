import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCustomForms } from "@/lib/actions/forms";
import { requirePermission, checkPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { ClipboardList, Plus, FileText, Calendar, Edit } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteFormButton } from "@/components/forms/delete-form-button";

export default async function FormsPage() {
  await requirePermission(PERMISSIONS.FORMS);
  const canManage = await checkPermission(PERMISSIONS.FORMS_CREATE);

  const forms = await getCustomForms();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Custom Forms</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create and manage custom checklists, logs, and forms
          </p>
        </div>
        {canManage && (
          <Link href="/forms/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </Link>
        )}
      </div>

      {/* Forms Grid */}
      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No custom forms yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Create custom forms for checklists, logs, and other recurring tasks.
              </p>
              {canManage && (
                <Link href="/forms/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Form
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => {
            const fields = form.fields as unknown as { id: string; label: string; type: string }[];
            return (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-blue-600" />
                        {form.name}
                      </CardTitle>
                      {form.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {form.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {form.schedule && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {form.schedule.toLowerCase()}
                        </Badge>
                      )}
                      {!form.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {fields?.length || 0} fields
                      </span>
                      <span>
                        {form._count.Responses} response{form._count.Responses !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Created {format(new Date(form.createdAt), "dd MMM yyyy")}
                      {form.CreatedBy?.name && ` by ${form.CreatedBy.name}`}
                    </p>

                    <div className="flex items-center gap-2 pt-2">
                      <Link href={`/forms/${form.id}/fill`} className="flex-1">
                        <Button className="w-full" size="sm">
                          Fill Form
                        </Button>
                      </Link>
                      <Link href={`/forms/${form.id}/responses`}>
                        <Button variant="outline" size="sm">
                          Responses
                        </Button>
                      </Link>
                      {canManage && (
                        <>
                          <Link href={`/forms/${form.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteFormButton formId={form.id} formName={form.name} />
                        </>
                      )}
                    </div>
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
