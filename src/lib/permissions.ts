import { UserRole } from "@prisma/client";

/**
 * Permission constants for features in the application
 */
export const PERMISSIONS = {
  // Core features
  DASHBOARD: "dashboard",
  DOCUMENTS: "documents",
  TASKS: "tasks",
  CALENDAR: "calendar",
  TRAINING: "training",
  LEAVE: "leave",

  // OHSC Registers
  COMPLAINTS: "complaints",
  ADVERSE_EVENTS: "adverse_events",

  // HR Management
  EMPLOYEES: "employees",
  EMPLOYEES_CRUD: "employees_crud", // Create, edit, delete employees
  PAYROLL: "payroll",

  // Logbook & Custom Forms
  LOGBOOK: "logbook",
  LOGBOOK_CRUD: "logbook_crud",

  // Premium features (Professional plan only)
  AI_ASSISTANT: "ai_assistant",

  // Admin features
  TEAM: "team",
  SETTINGS: "settings",

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
 * Access Tiers:
 * - PRACTICE_OWNER (Admin/Owner): Full access to everything
 * - ADMIN (Full Access): All features except Team & Settings
 * - STAFF (Intermediate): No Payroll/Team/Settings, can view employees but not edit
 * - VIEWER (Minimum): Personal access only - own tasks, leave, view documents
 */
const PERMISSION_MATRIX: Record<Permission, UserRole[]> = {
  // Core features - all roles except LOCUM can access
  [PERMISSIONS.DASHBOARD]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.DOCUMENTS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.TASKS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.CALENDAR]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.TRAINING]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],
  [PERMISSIONS.LEAVE]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],

  // OHSC Registers - Admin and above can access
  [PERMISSIONS.COMPLAINTS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF"],
  [PERMISSIONS.ADVERSE_EVENTS]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF"],

  // Logbook & Custom Forms
  [PERMISSIONS.LOGBOOK]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF"],
  [PERMISSIONS.LOGBOOK_CRUD]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],

  // HR Management - limited access
  [PERMISSIONS.EMPLOYEES]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF"],
  [PERMISSIONS.EMPLOYEES_CRUD]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],
  [PERMISSIONS.PAYROLL]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN"],

  // Premium features - all roles can access IF subscription allows
  [PERMISSIONS.AI_ASSISTANT]: ["SUPER_ADMIN", "PRACTICE_OWNER", "ADMIN", "STAFF", "VIEWER"],

  // Admin features - owner only
  [PERMISSIONS.TEAM]: ["SUPER_ADMIN", "PRACTICE_OWNER"],
  [PERMISSIONS.SETTINGS]: ["SUPER_ADMIN", "PRACTICE_OWNER"],

};

/**
 * Route to permission mapping
 */
const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": PERMISSIONS.DASHBOARD,
  "/documents": PERMISSIONS.DOCUMENTS,
  "/tasks": PERMISSIONS.TASKS,
  "/calendar": PERMISSIONS.CALENDAR,
  "/training": PERMISSIONS.TRAINING,
  "/leave": PERMISSIONS.LEAVE,
  "/complaints": PERMISSIONS.COMPLAINTS,
  "/adverse-events": PERMISSIONS.ADVERSE_EVENTS,
  "/employees": PERMISSIONS.EMPLOYEES,
  "/payroll": PERMISSIONS.PAYROLL,
  "/financial-metrics": PERMISSIONS.PAYROLL,
  "/ai-assistant": PERMISSIONS.AI_ASSISTANT,
  "/logbook": PERMISSIONS.LOGBOOK,
  "/forms": PERMISSIONS.LOGBOOK,
  "/team": PERMISSIONS.TEAM,
  "/settings": PERMISSIONS.SETTINGS,
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
      return "Admin (Owner)";
    case "ADMIN":
      return "Full Access";
    case "STAFF":
      return "Intermediate Access";
    case "VIEWER":
      return "Minimum Access";
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
      return "Full access including team management and settings";
    case "ADMIN":
      return "All features except team management and settings";
    case "STAFF":
      return "View employees, manage tasks, documents, and leave";
    case "VIEWER":
      return "Personal tasks, leave requests, and view documents only";
    case "LOCUM":
      return "Temporary staff with clock in/out only";
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
      label: "Full Access",
      description: "All features except team management and settings",
    },
    {
      value: "STAFF",
      label: "Intermediate Access",
      description: "View employees, manage tasks, documents, and leave",
    },
    {
      value: "VIEWER",
      label: "Minimum Access",
      description: "Personal tasks, leave requests, and view documents only",
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
    { href: "/training", label: "Training", permission: PERMISSIONS.TRAINING },
    { href: "/leave", label: "Leave", permission: PERMISSIONS.LEAVE },
  ],
  hr: [
    { href: "/employees", label: "Employees", permission: PERMISSIONS.EMPLOYEES },
    { href: "/payroll", label: "Payroll", permission: PERMISSIONS.PAYROLL },
  ],
  admin: [
    { href: "/team", label: "Team", permission: PERMISSIONS.TEAM },
    { href: "/settings", label: "Settings", permission: PERMISSIONS.SETTINGS },
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
