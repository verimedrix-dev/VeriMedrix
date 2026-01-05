"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Activity,
  FileText,
  LifeBuoy,
  Settings,
  Bell,
  Shield,
  Mail,
  MessageSquare,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const mainNavigation: NavItem[] = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Practices", href: "/admin/practices", icon: Building2 },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
];

const analyticsNavigation: NavItem[] = [
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Complaints", href: "/admin/complaints", icon: MessageSquare },
  { name: "System Health", href: "/admin/health", icon: Activity },
];

const contentNavigation: NavItem[] = [
  { name: "Content", href: "/admin/content", icon: FileText },
  { name: "Announcements", href: "/admin/announcements", icon: Bell },
  { name: "Email Templates", href: "/admin/emails", icon: Mail },
];

const supportNavigation: NavItem[] = [
  { name: "Support Tickets", href: "/admin/support", icon: LifeBuoy },
  { name: "Audit Logs", href: "/admin/audit", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      )}
    >
      <item.icon className="h-5 w-5" />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-primary text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="pt-4">
      <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        {title}
      </p>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
}

export function AdminSidebar() {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {mainNavigation.map((item) => (
        <NavLink key={item.name} item={item} />
      ))}

      <NavSection title="Monitoring" items={analyticsNavigation} />
      <NavSection title="Content" items={contentNavigation} />
      <NavSection title="Support & Settings" items={supportNavigation} />
    </nav>
  );
}
