import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FolderOpen,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { getDocumentCategoriesAdmin, getContentStats } from "@/lib/actions/admin/content";
import { AddCategoryDialog } from "@/components/admin/add-category-dialog";
import { AddDocTypeDialog } from "@/components/admin/add-doc-type-dialog";

export default async function ContentManagementPage() {
  const [categories, stats] = await Promise.all([
    getDocumentCategoriesAdmin(),
    getContentStats(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage document categories, types, and templates
          </p>
        </div>
        <AddCategoryDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentCategories}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Types</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documentTypes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Templates</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taskTemplates.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Modules</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trainingModules}</div>
          </CardContent>
        </Card>
      </div>

      {/* Document Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Document Categories & Types
          </CardTitle>
          <CardDescription>
            Configure document categories and their associated document types
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No categories created yet. Click &ldquo;Add Category&rdquo; to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-lg dark:border-slate-700">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-t-lg">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-slate-500">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {category.DocumentType.length} types
                      </Badge>
                      <AddDocTypeDialog categoryId={category.id} categoryName={category.name} />
                    </div>
                  </div>

                  {category.DocumentType.length > 0 && (
                    <div className="divide-y dark:divide-slate-700">
                      {category.DocumentType.map((docType) => (
                        <div key={docType.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 dark:text-white">
                                  {docType.name}
                                </span>
                                {docType.isRequired && (
                                  <Badge variant="outline" className="text-xs">Required</Badge>
                                )}
                                {docType.requiresExpiry && (
                                  <Badge variant="outline" className="text-xs text-amber-600">
                                    Has Expiry
                                  </Badge>
                                )}
                              </div>
                              {docType.description && (
                                <p className="text-sm text-slate-500 mt-1">{docType.description}</p>
                              )}
                              {docType.ohscMeasureNumber && (
                                <p className="text-xs text-slate-400 mt-1">
                                  OHSC Measure: {docType.ohscMeasureNumber}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">
                              {docType._count.Document} documents
                            </span>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
