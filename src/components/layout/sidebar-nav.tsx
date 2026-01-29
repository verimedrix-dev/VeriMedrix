"use client";

import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  Settings,
  Bell,
  Calendar,
  UserCircle,
  CalendarOff,
  GraduationCap,
  Wallet,
  Stethoscope,
  Bot,
  LucideIcon,
  MessageSquare,
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Shield,
  HelpCircle,
  TrendingUp,
  Package,
} from "lucide-react";
import { NavLink } from "./nav-link";
import { UserRole, SubscriptionTier } from "@prisma/client";
import { hasPermission, PERMISSIONS, Permission } from "@/lib/permissions";
import { SUBSCRIPTION_LIMITS } from "@/lib/subscription-config";

type SubscriptionFeature = keyof typeof SUBSCRIPTION_LIMITS.ESSENTIALS.features;

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
  badge?: string;
  requiredFeature?: SubscriptionFeature;
}

const mainNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD },
  { name: "Inspection Readiness", href: "/inspection-readiness", icon: Shield, permission: PERMISSIONS.DASHBOARD, requiredFeature: "inspectionReadiness" },
  { name: "OHSC Documents", href: "/documents", icon: FileText, permission: PERMISSIONS.DOCUMENTS, requiredFeature: "documents" },
  { name: "AI Assistant", href: "/ai-assistant", icon: Bot, permission: PERMISSIONS.AI_ASSISTANT, requiredFeature: "aiAssistant" },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, permission: PERMISSIONS.TASKS, requiredFeature: "tasks" },
  { name: "Logbook", href: "/logbook", icon: ClipboardCheck, permission: PERMISSIONS.TASKS, requiredFeature: "logbook" },
  { name: "Custom Forms", href: "/forms", icon: ClipboardList, permission: PERMISSIONS.LOGBOOK, requiredFeature: "logbook" },
  { name: "Calendar", href: "/calendar", icon: Calendar, permission: PERMISSIONS.CALENDAR },
];

// OHSC Registers - for OHSC compliance tracking
const registersNavigation: NavItem[] = [
  { name: "Complaints", href: "/complaints", icon: MessageSquare, permission: PERMISSIONS.COMPLAINTS, requiredFeature: "complaints" },
  { name: "Adverse Events", href: "/adverse-events", icon: AlertTriangle, permission: PERMISSIONS.ADVERSE_EVENTS, requiredFeature: "adverseEvents" },
];

const hrNavigation: NavItem[] = [
  { name: "Employees", href: "/employees", icon: UserCircle, permission: PERMISSIONS.EMPLOYEES },
  { name: "Locums", href: "/locums", icon: Stethoscope, permission: PERMISSIONS.EMPLOYEES, requiredFeature: "locums" },
  { name: "Payroll", href: "/payroll", icon: Wallet, permission: PERMISSIONS.PAYROLL, requiredFeature: "payroll" },
  { name: "Financial Metrics", href: "/financial-metrics", icon: TrendingUp, permission: PERMISSIONS.PAYROLL, requiredFeature: "financialMetrics" },
  { name: "Inventory", href: "/inventory", icon: Package, permission: PERMISSIONS.PAYROLL, requiredFeature: "inventory" },
  { name: "Leave", href: "/leave", icon: CalendarOff, permission: PERMISSIONS.LEAVE, requiredFeature: "leaveManagement" },
  { name: "Training", href: "/training", icon: GraduationCap, permission: PERMISSIONS.TRAINING, requiredFeature: "training" },
];

const adminNavigation: NavItem[] = [
  { name: "Team", href: "/team", icon: Users, permission: PERMISSIONS.TEAM },
  { name: "Notifications", href: "/notifications", icon: Bell, permission: PERMISSIONS.DASHBOARD },
  { name: "Settings", href: "/settings", icon: Settings, permission: PERMISSIONS.SETTINGS },
];

// Support - available to all users
const supportNavigation: NavItem[] = [
  { name: "Support", href: "/support", icon: HelpCircle, permission: PERMISSIONS.DASHBOARD },
];


interface SidebarNavProps {
  userRole: UserRole;
  subscriptionTier?: SubscriptionTier;
  unreadNotifications?: number;
}

export function SidebarNav({ userRole, subscriptionTier, unreadNotifications = 0 }: SidebarNavProps) {
  const tier = subscriptionTier || "ESSENTIALS";
  const tierFeatures = SUBSCRIPTION_LIMITS[tier].features;

  // Filter navigation items based on user permissions AND subscription features
  const filterByPermissionAndFeature = (item: NavItem) => {
    // First check role permission
    if (!hasPermission(userRole, item.permission)) return false;
    // Then check subscription feature (if required)
    if (item.requiredFeature && !tierFeatures[item.requiredFeature]) return false;
    return true;
  };

  const filteredMain = mainNavigation.filter(filterByPermissionAndFeature);
  const filteredRegisters = registersNavigation.filter(filterByPermissionAndFeature);
  const filteredHr = hrNavigation.filter(filterByPermissionAndFeature);
  const filteredAdmin = adminNavigation.filter(filterByPermissionAndFeature);
  const filteredSupport = supportNavigation.filter(filterByPermissionAndFeature);

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {filteredMain.map((item) => (
        <NavLink key={item.name} name={item.name} href={item.href} icon={item.icon} badge={item.badge} />
      ))}

      {/* OHSC Registers Section - Complaints & Adverse Events */}
      {filteredRegisters.length > 0 && (
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            OHSC Registers
          </p>
          <div className="mt-2 space-y-1">
            {filteredRegisters.map((item) => (
              <NavLink key={item.name} name={item.name} href={item.href} icon={item.icon} />
            ))}
          </div>
        </div>
      )}

      {/* HR Section - only show if user has access to at least one HR item */}
      {filteredHr.length > 0 && (
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            HR Management
          </p>
          <div className="mt-2 space-y-1">
            {filteredHr.map((item) => (
              <NavLink key={item.name} name={item.name} href={item.href} icon={item.icon} />
            ))}
          </div>
        </div>
      )}

      {/* Admin Section - only show if user has access to at least one admin item */}
      {filteredAdmin.length > 0 && (
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Settings
          </p>
          <div className="mt-2 space-y-1">
            {filteredAdmin.map((item) => (
              <NavLink
                key={item.name}
                name={item.name}
                href={item.href}
                icon={item.icon}
                showDot={item.name === "Notifications" && unreadNotifications > 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Support Section */}
      {filteredSupport.length > 0 && (
        <div className="pt-4">
          <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Help
          </p>
          <div className="mt-2 space-y-1">
            {filteredSupport.map((item) => (
              <NavLink key={item.name} name={item.name} href={item.href} icon={item.icon} />
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
