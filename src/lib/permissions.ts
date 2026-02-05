import { UserRole } from "@prisma/client";

/**
 * Permission constants for features in the application
 *
 * Access Levels:
 * - Minimum (STAFF): Basic staff access
 * - Intermediate (ADMIN): Manager-level access
 * - Full (PRACTICE_OWNER): Admin/Owner access
 */
export const PERMISSIONS = {
  // ============================================
  // FULL ACCESS FOR ALL ROLES
  // ============================================
  DASHBOARD: "dashboard",
  DOCUMENTS: "documents",
  TASKS: "tasks",
  CALENDAR: "calendar",
  LOGBOOK: "logbook",
  COMPLAINTS: "complaints",
  ADVERSE_EVENTS: "adverse_events",
  INSPECTION_READINESS: "inspection_readiness",
  AI_ASSISTANT: "ai_assistant",
  INVENTORY: "inventory",

  // ============================================
  // RESTRICTED ACCESS - TRAINING
  // Minimum: View own records
  // Intermediate: View team + Schedule
  // Full: Full access
  // ============================================
  TRAINING: "training",
  TRAINING_VIEW_OWN: "training_view_own",
  TRAINING_MANAGE_TEAM: "training_manage_team",
  TRAINING_FULL: "training_full",

  // ============================================
  // RESTRICTED ACCESS - LEAVE
  // Minimum: Request own leave
  // Intermediate: Approve team leave
  // Full: Full access
  // ============================================
  LEAVE: "leave",
  LEAVE_REQUEST_OWN: "leave_request_own",
  LEAVE_APPROVE_TEAM: "leave_approve_team",
  LEAVE_FULL: "leave_full",

  // ============================================
  // RESTRICTED ACCESS - EMPLOYEES
  // Minimum: View own profile
  // Intermediate: View team profiles
  // Full: Full access (CRUD)
  // ============================================
  EMPLOYEES: "employees",
  EMPLOYEES_VIEW_OWN: "employees_view_own",
  EMPLOYEES_VIEW_TEAM: "employees_view_team",
  EMPLOYEES_FULL: "employees_full",

  // ============================================
  // RESTRICTED ACCESS - PAYROLL
  // Minimum: View own payslips
  // Intermediate: Full access
  // Full: Full access
  // ============================================
  PAYROLL: "payroll",
  PAYROLL_VIEW_OWN: "payroll_view_own",
  PAYROLL_FULL: "payroll_full",

  // ============================================
  // RESTRICTED ACCESS - LOCUMS
  // Minimum: Clock in/out only
  // Intermediate: Full access
  // Full: Full access
  // ============================================
  LOCUMS: "locums",
  LOCUMS_CLOCK: "locums_clock",
  LOCUMS_FULL: "locums_full",

  // ============================================
  // RESTRICTED ACCESS - FORMS
  // Minimum: Fill assigned forms
  // Intermediate: Create forms
  // Full: Full access
  // ============================================
  FORMS: "forms",
  FORMS_FILL: "forms_fill",
  FORMS_CREATE: "forms_create",
  FORMS_FULL: "forms_full",

  // ============================================
  // ADMIN ONLY (Full access only)
  // ============================================
  TEAM: "team",
  SETTINGS: "settings",
  FINANCIAL_METRICS: "financial_metrics",

} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role hierarchy (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  PRACTICE_OWNER: 90,
  ADMIN: 80,
  STAFF: 50,
  VIEWER: 10,
  LOCUM: 5,
};

/**
 * Permission matrix: which roles have which permissions
 *
 * Access Tiers (based on VeriMedrix RBAC Matrix):
 * - PRACTICE_OWNER / SUPER_ADMIN: Full (Admin/Owner) - Full access to everything
 * - ADMIN: Intermediate (Manager) - Full access except Team, Settings, Financial Metrics
 * - STAFF: Minimum (Staff) - Limited access to HR features, view own data
 * - VIEWER: Same as STAFF (legacy role)
 * - LOCUM: Clock in/out only
 */
const PERMISSION_MATRIX: Record<Permission, UserRole[]> = {
  // ============================================
  // FULL ACCESS FOR ALL ROLES (except LOCUM)
  // Dashboard, Documents, Tasks, Calendar, Logbook, Complaints,
  // Adverse Events, Inspection Readiness, AI Assistant, Inventory
  // ============================================
  [PERMISSIONS.DASHBOARD]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.DOCUMENTS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.TASKS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.CALENDAR]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.LOGBOOK]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.COMPLAINTS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.ADVERSE_EVENTS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.INSPECTION_READINESS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.AI_ASSISTANT]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.INVENTORY]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],

  // ============================================
  // TRAINING - Tiered access
  // ============================================
  [PERMISSIONS.TRAINING]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.TRAINING_VIEW_OWN]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.TRAINING_MANAGE_TEAM]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],
  [PERMISSIONS.TRAINING_FULL]: ["SUPER_ADMIN", "PRACTICE_OWNER"],

  // ============================================
  // LEAVE - Tiered access
  // ============================================
  [PERMISSIONS.LEAVE]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.LEAVE_REQUEST_OWN]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.LEAVE_APPROVE_TEAM]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],
  [PERMISSIONS.LEAVE_FULL]: ["SUPER_ADMIN", "PRACTICE_OWNER"],

  // ============================================
  // EMPLOYEES - Tiered access
  // ============================================
  [PERMISSIONS.EMPLOYEES]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.EMPLOYEES_VIEW_OWN]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.EMPLOYEES_VIEW_TEAM]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],
  [PERMISSIONS.EMPLOYEES_FULL]: ["SUPER_ADMIN", "PRACTICE_OWNER"],

  // ============================================
  // PAYROLL - Tiered access
  // ============================================
  [PERMISSIONS.PAYROLL]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.PAYROLL_VIEW_OWN]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.PAYROLL_FULL]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],

  // ============================================
  // LOCUMS - Manager and above only (Staff has no access)
  // LOCUM role can access for self-service when invited
  // ============================================
  [PERMISSIONS.LOCUMS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "LOCUM"],
  [PERMISSIONS.LOCUMS_CLOCK]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "LOCUM"],
  [PERMISSIONS.LOCUMS_FULL]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],

  // ============================================
  // FORMS - Tiered access
  // ============================================
  [PERMISSIONS.FORMS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.FORMS_FILL]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.FORMS_CREATE]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],
  [PERMISSIONS.FORMS_FULL]: ["SUPER_ADMIN", "PRACTICE_OWNER"],

  // ============================================
  // ADMIN ONLY - Full (Admin/Owner) access only
  // ============================================
  [PERMISSIONS.TEAM]: ["SUPER_ADMIN", "PRACTICE_OWNER"],
  [PERMISSIONS.SETTINGS]: ["SUPER_ADMIN", "PRACTICE_OWNER"],
  [PERMISSIONS.FINANCIAL_METRICS]: ["SUPER_ADMIN", "PRACTICE_OWNER"],

};

/**
 * Route to permission mapping
 */
const ROUTE_PERMISSIONS: Record<string, Permission> = {
  // Full access for all
  "/dashboard": PERMISSIONS.DASHBOARD,
  "/documents": PERMISSIONS.DOCUMENTS,
  "/tasks": PERMISSIONS.TASKS,
  "/calendar": PERMISSIONS.CALENDAR,
  "/logbook": PERMISSIONS.LOGBOOK,
  "/complaints": PERMISSIONS.COMPLAINTS,
  "/adverse-events": PERMISSIONS.ADVERSE_EVENTS,
  "/inspection-readiness": PERMISSIONS.INSPECTION_READINESS,
  "/ai-assistant": PERMISSIONS.AI_ASSISTANT,
  "/inventory": PERMISSIONS.INVENTORY,
  "/service-providers": PERMISSIONS.DASHBOARD,
  "/notifications": PERMISSIONS.DASHBOARD,
  "/support": PERMISSIONS.DASHBOARD,

  // Tiered access routes
  "/training": PERMISSIONS.TRAINING,
  "/leave": PERMISSIONS.LEAVE,
  "/employees": PERMISSIONS.EMPLOYEES,
  "/payroll": PERMISSIONS.PAYROLL,
  "/locums": PERMISSIONS.LOCUMS,
  "/locum-profile": PERMISSIONS.LOCUMS,
  "/timesheet-history": PERMISSIONS.LOCUMS,
  "/clock": PERMISSIONS.LOCUMS,
  "/forms": PERMISSIONS.FORMS,

  // Admin only routes
  "/team": PERMISSIONS.TEAM,
  "/settings": PERMISSIONS.SETTINGS,
  "/financial-metrics": PERMISSIONS.FINANCIAL_METRICS,
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSION_MATRIX[permission];
  return allowedRoles?.includes(role) ?? false;
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Find matching route (check for exact match or prefix match)
  const matchingRoute = Object.keys(ROUTE_PERMISSIONS).find((route) => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + "/")) return true;
    return false;
  });

  if (!matchingRoute) {
    // If no specific permission required, allow access
    return true;
  }

  const permission = ROUTE_PERMISSIONS[matchingRoute];
  return hasPermission(role, permission);
}

/**
 * Get the friendly display name for an access level
 */
export function getAccessLevelDisplayName(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "PRACTICE_OWNER":
      return "Full Access (Admin/Owner)";
    case "ADMIN":
      return "Intermediate Access (Manager)";
    case "STAFF":
      return "Minimum Access (Staff)";
    case "VIEWER":
      return "Minimum Access (Staff)";
    case "LOCUM":
      return "Locum";
    default:
      return role;
  }
}

/**
 * Get a description of what each access level can do
 */
export function getAccessLevelDescription(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Full system access across all practices";
    case "PRACTICE_OWNER":
      return "Full access including team management, settings, and financial metrics";
    case "ADMIN":
      return "Full access to payroll and locums, can approve leave and view team. No access to settings, team invitations, or financial metrics.";
    case "STAFF":
      return "Full access to compliance features. View own profile, request leave, view own payslips, clock in/out for locums, fill assigned forms.";
    case "VIEWER":
      return "Full access to compliance features. View own profile, request leave, view own payslips, clock in/out for locums, fill assigned forms.";
    case "LOCUM":
      return "Clock in/out access only";
    default:
      return "";
  }
}

/**
 * Get roles that can be invited by an admin (excludes SUPER_ADMIN and PRACTICE_OWNER)
 */
export function getInvitableRoles(): { value: UserRole; label: string; description: string }[] {
  return [
    {
      value: "ADMIN",
      label: "Intermediate Access (Manager)",
      description: "Full access to payroll/locums, approve team leave. No settings, team invitations, or financial metrics.",
    },
    {
      value: "STAFF",
      label: "Minimum Access (Staff)",
      description: "Full compliance access. View own profile, request leave, view own payslips, fill assigned forms.",
    },
  ];
}

/**
 * Check if a role is higher than or equal to another role
 */
export function isRoleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can manage another user's role (can only manage lower roles)
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  // Only owners can manage roles
  if (managerRole !== "PRACTICE_OWNER" && managerRole !== "SUPER_ADMIN") {
    return false;
  }
  // Cannot manage someone of equal or higher role
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return Object.entries(PERMISSION_MATRIX)
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([permission]) => permission as Permission);
}

/**
 * Navigation items with their required permissions
 */
export const NAVIGATION_ITEMS = {
  main: [
    { href: "/dashboard", label: "Dashboard", permission: PERMISSIONS.DASHBOARD },
    { href: "/documents", label: "OHSC Documents", permission: PERMISSIONS.DOCUMENTS },
    { href: "/tasks", label: "Tasks", permission: PERMISSIONS.TASKS },
    { href: "/calendar", label: "Calendar", permission: PERMISSIONS.CALENDAR },
    { href: "/logbook", label: "Logbook", permission: PERMISSIONS.LOGBOOK },
    { href: "/complaints", label: "Complaints", permission: PERMISSIONS.COMPLAINTS },
    { href: "/adverse-events", label: "Adverse Events", permission: PERMISSIONS.ADVERSE_EVENTS },
    { href: "/inspection-readiness", label: "Inspection Readiness", permission: PERMISSIONS.INSPECTION_READINESS },
    { href: "/ai-assistant", label: "AI Assistant", permission: PERMISSIONS.AI_ASSISTANT },
  ],
  hr: [
    { href: "/training", label: "Training", permission: PERMISSIONS.TRAINING },
    { href: "/leave", label: "Leave", permission: PERMISSIONS.LEAVE },
    { href: "/employees", label: "Employees", permission: PERMISSIONS.EMPLOYEES },
    { href: "/payroll", label: "Payroll", permission: PERMISSIONS.PAYROLL },
    { href: "/locums", label: "Locums", permission: PERMISSIONS.LOCUMS },
    { href: "/forms", label: "Custom Forms", permission: PERMISSIONS.FORMS },
  ],
  admin: [
    { href: "/team", label: "Team", permission: PERMISSIONS.TEAM },
    { href: "/settings", label: "Settings", permission: PERMISSIONS.SETTINGS },
    { href: "/financial-metrics", label: "Financial Metrics", permission: PERMISSIONS.FINANCIAL_METRICS },
  ],
};

/**
 * Filter navigation items based on user role
 */
export function getNavigationForRole(role: UserRole) {
  return {
    main: NAVIGATION_ITEMS.main.filter((item) => hasPermission(role, item.permission)),
    hr: NAVIGATION_ITEMS.hr.filter((item) => hasPermission(role, item.permission)),
    admin: NAVIGATION_ITEMS.admin.filter((item) => hasPermission(role, item.permission)),
  };
}
