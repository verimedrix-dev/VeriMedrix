"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  providerCount: number;
};

type CategoryFilterProps = {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  totalProviders: number;
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  totalProviders,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      <button
        onClick={() => onCategoryChange(null)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
          selectedCategory === null
            ? "bg-blue-600 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        )}
      >
        All
        <Badge
          variant="secondary"
          className={cn(
            "h-5 min-w-[20px] px-1 text-xs",
            selectedCategory === null
              ? "bg-blue-500 text-white"
              : "bg-slate-200 dark:bg-slate-700"
          )}
        >
          {totalProviders}
        </Badge>
      </button>
      {categories
        .filter((c) => c.providerCount > 0)
        .map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === category.id
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {category.name}
            <Badge
              variant="secondary"
              className={cn(
                "h-5 min-w-[20px] px-1 text-xs",
                selectedCategory === category.id
                  ? "bg-blue-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700"
              )}
            >
              {category.providerCount}
            </Badge>
          </button>
        ))}
    </div>
  );
}
