"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight, FileText, FileDown } from "lucide-react";

interface DocumentType {
  id: string;
  name: string;
  hasTemplate?: boolean;
}

interface Category {
  id: string;
  name: string;
  DocumentType: DocumentType[];
}

interface CategorySidebarProps {
  categories: Category[];
  totalDocuments: number;
  documentCountByCategory: Record<string, number>;
  documentCountByType?: Record<string, number>;
}

export function CategorySidebar({
  categories,
  totalDocuments,
  documentCountByCategory,
  documentCountByType = {},
}: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const currentType = searchParams.get("type");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(currentCategory);

  const handleCategoryClick = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categoryId === null) {
      params.delete("category");
      params.delete("type");
      setExpandedCategory(null);
    } else {
      params.set("category", categoryId);
      params.delete("type");
      // Toggle expand
      setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
    }

    router.push(`/documents?${params.toString()}`);
  };

  const handleTypeClick = (categoryId: string, typeId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", categoryId);
    params.set("type", typeId);
    router.push(`/documents?${params.toString()}`);
  };

  return (
    <Card className="w-72 shrink-0 h-fit max-h-[calc(100vh-16rem)] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto">
        <div className="space-y-0.5 p-2">
          {/* All Documents button */}
          <button
            onClick={() => handleCategoryClick(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
              !currentCategory
                ? "bg-slate-100 dark:bg-slate-800 font-medium"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <span className="text-slate-700 dark:text-slate-200">All Documents</span>
            <Badge variant="secondary" className="text-xs">
              {totalDocuments}
            </Badge>
          </button>

          {/* Category buttons with expandable subcategories */}
          {categories.map((category) => {
            const isExpanded = expandedCategory === category.id;
            const isActive = currentCategory === category.id && !currentType;

            return (
              <div key={category.id}>
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 font-medium"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 text-slate-400 transition-transform flex-shrink-0",
                        isExpanded && "rotate-90"
                      )}
                    />
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      {category.name}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                    {documentCountByCategory[category.id] || 0}
                  </Badge>
                </button>

                {/* Subcategories (Document Types) */}
                {isExpanded && category.DocumentType.length > 0 && (
                  <div className="ml-4 pl-2 border-l border-slate-200 dark:border-slate-700 space-y-0.5 py-1">
                    {category.DocumentType.map((docType) => {
                      const isTypeActive = currentType === docType.id;
                      const typeCount = documentCountByType[docType.id] || 0;

                      return (
                        <button
                          key={docType.id}
                          onClick={() => handleTypeClick(category.id, docType.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors",
                            isTypeActive
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{docType.name}</span>
                            {docType.hasTemplate && (
                              <FileDown className="h-3 w-3 flex-shrink-0 text-blue-500" />
                            )}
                          </div>
                          {typeCount > 0 && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] h-4 px-1 flex-shrink-0 ml-1",
                                isTypeActive && "bg-blue-100 dark:bg-blue-900/50"
                              )}
                            >
                              {typeCount}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
