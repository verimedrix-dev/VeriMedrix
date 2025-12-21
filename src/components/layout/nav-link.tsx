"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  name: string;
  icon: LucideIcon;
  badge?: string;
  showDot?: boolean;
}

export function NavLink({ href, name, icon: Icon, badge, showDot }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      prefetch={true}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
    >
      <div className="relative">
        <Icon className="h-5 w-5" />
        {showDot && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
        )}
      </div>
      <span className="flex-1">{name}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
