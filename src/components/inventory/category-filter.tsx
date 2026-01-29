"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: { id: string; name: string; itemCount: number }[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectCategory(null)}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className="gap-1.5"
        >
          {category.name}
          <Badge
            variant="secondary"
            className={cn(
              "ml-1 h-5 min-w-[20px] px-1.5 text-xs",
              selectedCategory === category.id
                ? "bg-primary-foreground/20 text-primary-foreground"
                : ""
            )}
          >
            {category.itemCount}
          </Badge>
        </Button>
      ))}
    </div>
  );
}
