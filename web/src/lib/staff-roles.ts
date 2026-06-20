import type { AdminModule } from "./admin-modules";
import { ADMIN_MODULES } from "./admin-modules";

export const STAFF_ROLES = [
  "super_admin",
  "operations_manager",
  "research_analyst",
  "field_supervisor",
  "finance_officer",
  "client_viewer",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  operations_manager: "Operations Manager",
  research_analyst: "Research Analyst",
  field_supervisor: "Field Supervisor",
  finance_officer: "Finance Officer",
  client_viewer: "Client Viewer",
};

export const STAFF_ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  super_admin: "Full access to every admin module, settings, and platform controls.",
  operations_manager: "Panel register, campaigns, sampling, distribution, and fieldwork operations.",
  research_analyst: "Analytics, reporting, client projects, and survey distribution insights.",
  field_supervisor: "Fieldwork quality control, fraud review, and under-review queue.",
  finance_officer: "Payout requests, financial revenue, and redemption processing.",
  client_viewer: "Read-only access to assigned client reporting modules.",
};

const ROLE_MODULE_ACCESS: Record<StaffRole, readonly string[]> = {
  super_admin: ADMIN_MODULES.map((module) => module.slug),
  operations_manager: [
    "panelists",
    "panelist-groups",
    "admin-dashboard",
    "under-review",
    "notifications",
    "payouts",
    "fraud-prevention",
    "sample-selection",
    "campaigns",
    "create-campaign",
    "reward-settings",
    "survey-builder",
    "survey-templates",
    "survey-distribution",
    "distribution-engine",
    "fieldwork-management",
    "communication-notifications",
    "external-data-import",
  ],
  research_analyst: [
    "admin-dashboard",
    "panelist-groups",
    "advanced-analytics",
    "survey-builder",
    "survey-templates",
    "survey-distribution",
    "distribution-engine",
    "client-reporting",
    "client-project-management",
  ],
  field_supervisor: [
    "admin-dashboard",
    "under-review",
    "fieldwork-management",
    "fraud-prevention",
    "survey-distribution",
  ],
  finance_officer: ["admin-dashboard", "payouts", "financial-revenue", "reward-settings"],
  client_viewer: ["client-reporting"],
};

const ADMIN_PATH_TO_SLUG: Record<string, string> = {
  "/admin/dashboard": "admin-dashboard",
  "/admin/panelists": "panelists",
  "/admin/groups": "panelist-groups",
  "/admin/under-review": "under-review",
  "/admin/notifications": "notifications",
  "/admin/payouts": "payouts",
  "/admin/fraud-prevention": "fraud-prevention",
  "/admin/sample-selection": "sample-selection",
  "/admin/campaigns": "campaigns",
  "/admin/campaigns/create": "create-campaign",
  "/admin/reward-settings": "reward-settings",
  "/admin/survey-distribution": "survey-distribution",
  "/admin/analytics": "advanced-analytics",
};

const ALL_MODULE_SLUGS = new Set(ADMIN_MODULES.map((module) => module.slug));

export function isStaffRole(value: string | null | undefined): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

/** Maps legacy session roles and unknown values to a valid staff role. */
export function normalizeStaffRole(value: string | null | undefined): StaffRole | null {
  if (!value) return null;
  if (value === "admin") return "super_admin";
  return isStaffRole(value) ? value : null;
}

export function staffCanAccessModule(role: StaffRole, moduleSlug: string): boolean {
  if (role === "super_admin") return true;
  const access = ROLE_MODULE_ACCESS[role];
  if (!access) return false;
  return access.includes(moduleSlug);
}

export function staffAccessibleModules(role: StaffRole): AdminModule[] {
  return ADMIN_MODULES.filter((module) => staffCanAccessModule(role, module.slug));
}

export function staffDefaultAdminPath(role: StaffRole): string {
  if (role === "client_viewer") return "/admin/client-reporting";
  const first = staffAccessibleModules(role)[0];
  if (!first?.href) return "/admin/dashboard";
  return first.href;
}

export function pathnameToAdminModuleSlug(pathname: string): string | null {
  if (pathname === "/admin" || pathname === "/admin/") return "admin-dashboard";
  if (pathname.startsWith("/admin/templates")) return "survey-templates";
  if (pathname.startsWith("/admin/groups")) return "panelist-groups";
  if (pathname.startsWith("/admin/surveys")) return "survey-builder";
  if (ADMIN_PATH_TO_SLUG[pathname]) return ADMIN_PATH_TO_SLUG[pathname];

  if (pathname.startsWith("/admin/campaigns/") && pathname !== "/admin/campaigns/create") {
    return "campaigns";
  }

  const match = pathname.match(/^\/admin\/([^/]+)/);
  if (!match) return null;
  const slug = match[1];
  return ALL_MODULE_SLUGS.has(slug) ? slug : null;
}

export function adminPathAllowedForRole(role: StaffRole, pathname: string): boolean {
  if (pathname === "/admin" || pathname === "/admin/") return true;
  const slug = pathnameToAdminModuleSlug(pathname);
  if (!slug) return role === "super_admin";
  return staffCanAccessModule(role, slug);
}

export function staffRoleModuleSummary(role: StaffRole): string {
  return staffAccessibleModules(role)
    .map((module) => module.label)
    .join(", ");
}
