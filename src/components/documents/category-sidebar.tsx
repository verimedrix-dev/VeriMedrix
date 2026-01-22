"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  DocumentType: { id: string }[];
}

interface CategorySidebarProps {
  categories: Category[];
  totalDocuments: number;
  documentCountByCategory: Record<string, number>;
}

export function CategorySidebar({
  categories,
  totalDocuments,
  documentCountByCategory
}: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const handleCategoryClick = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categoryId === null) {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }

    router.push(`/documents?${params.toString()}`);
  };

  return (
    <Card className="w-64 shrink-0 h-fit">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Categories</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 p-2">
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

          {/* Category buttons */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                currentCategory === category.id
                  ? "bg-slate-100 dark:bg-slate-800 font-medium"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <span className="text-slate-700 dark:text-slate-300">{category.name}</span>
              <Badge variant="secondary" className="text-xs">
                {documentCountByCategory[category.id] || 0}
              </Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
