import type { AdminModuleContent } from "./admin-module-content";
import { getAdminModuleContent } from "./admin-module-content";

export type AdminModuleKind = "page" | "module";

export type AdminModuleStatus = "working" | "partial" | "planned" | "streamlit";

export type AdminNavSectionId = "panelists" | "campaigns" | "research" | "operations" | "platform";

export interface AdminNavSection {
  id: AdminNavSectionId;
  label: string;
}

export interface AdminModule {
  slug: string;
  label: string;
  kind: AdminModuleKind;
  href?: string;
  section: AdminNavSectionId;
  /** Renders indented beneath the parent item in the admin sidebar. */
  parentSlug?: string;
  /** Opens the panelist-facing flow in a new tab when set. */
  externalHref?: string;
  status?: AdminModuleStatus;
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  { id: "panelists", label: "Panelists" },
  { id: "campaigns", label: "Campaigns" },
  { id: "research", label: "Research" },
  { id: "operations", label: "Operations" },
  { id: "platform", label: "Platform" },
];

/**
 * Sidebar order matches appfiles/app.py (excluding removed MVP handoff items).
 */
export const ADMIN_MODULES: AdminModule[] = [
  {
    slug: "panelists",
    label: "Panelists",
    kind: "page",
    href: "/admin/panelists",
    section: "panelists",
    status: "working",
  },
  {
    slug: "admin-dashboard",
    label: "Admin Dashboard",
    kind: "page",
    href: "/admin/dashboard",
    section: "panelists",
    status: "working",
  },
  {
    slug: "under-review",
    label: "Under Review",
    kind: "page",
    href: "/admin/under-review",
    section: "panelists",
    status: "working",
  },
  {
    slug: "notifications",
    label: "Notifications",
    kind: "page",
    href: "/admin/notifications",
    section: "panelists",
    status: "working",
  },
  {
    slug: "payouts",
    label: "Payouts",
    kind: "page",
    href: "/admin/payouts",
    section: "panelists",
    status: "working",
  },
  {
    slug: "fraud-prevention",
    label: "Fraud Prevention",
    kind: "page",
    href: "/admin/fraud-prevention",
    section: "panelists",
    status: "working",
  },
  {
    slug: "sample-selection",
    label: "Sample Selection Engine",
    kind: "page",
    href: "/admin/sample-selection",
    section: "panelists",
    status: "working",
  },
  {
    slug: "campaigns",
    label: "Campaigns",
    kind: "page",
    href: "/admin/campaigns",
    section: "campaigns",
    status: "working",
  },
  {
    slug: "create-campaign",
    label: "Create Campaign",
    kind: "page",
    href: "/admin/campaigns/create",
    section: "campaigns",
    status: "working",
  },
  {
    slug: "survey-builder",
    label: "Survey Builder",
    kind: "page",
    href: "/admin/surveys",
    section: "campaigns",
    status: "working",
  },
  {
    slug: "survey-distribution",
    label: "Survey Distribution",
    kind: "page",
    href: "/admin/survey-distribution",
    section: "research",
    status: "working",
  },
  {
    slug: "advanced-analytics",
    label: "Advanced Analytics",
    kind: "page",
    href: "/admin/analytics",
    section: "research",
    status: "working",
  },
  {
    slug: "distribution-engine",
    label: "Distribution Engine",
    kind: "page",
    href: "/admin/distribution-engine",
    section: "research",
    status: "working",
  },
  {
    slug: "external-data-import",
    label: "External Data Import & Matching",
    kind: "page",
    href: "/admin/external-data-import",
    section: "operations",
    status: "working",
  },
  {
    slug: "client-project-management",
    label: "Client & Project Management",
    kind: "page",
    href: "/admin/client-project-management",
    section: "operations",
    status: "working",
  },
  {
    slug: "financial-revenue",
    label: "Financial & Revenue",
    kind: "page",
    href: "/admin/financial-revenue",
    section: "operations",
    status: "working",
  },
  {
    slug: "client-reporting",
    label: "Client Reporting Portal",
    kind: "page",
    href: "/admin/client-reporting",
    section: "operations",
    status: "working",
  },
  {
    slug: "communication-notifications",
    label: "Communication & Notifications",
    kind: "page",
    href: "/admin/communication-notifications",
    section: "operations",
    status: "working",
  },
  {
    slug: "fieldwork-management",
    label: "Fieldwork Management",
    kind: "page",
    href: "/admin/fieldwork-management",
    section: "operations",
    status: "working",
  },
  {
    slug: "data-protection",
    label: "Data Protection & Compliance",
    kind: "page",
    href: "/admin/data-protection",
    section: "platform",
    status: "working",
  },
  {
    slug: "user-roles",
    label: "User Roles & Permissions",
    kind: "page",
    href: "/admin/user-roles",
    section: "platform",
    status: "working",
  },
  {
    slug: "backup-recovery",
    label: "Backup & Recovery",
    kind: "page",
    href: "/admin/backup-recovery",
    section: "platform",
    status: "working",
  },
  {
    slug: "system-settings",
    label: "System Settings",
    kind: "page",
    href: "/admin/system-settings",
    section: "platform",
    status: "working",
  },
  {
    slug: "api-integrations",
    label: "API & Integrations",
    kind: "page",
    href: "/admin/api-integrations",
    section: "platform",
    status: "working",
  },
  {
    slug: "deployment-production",
    label: "Deployment & Production",
    kind: "page",
    href: "/admin/deployment-production",
    section: "platform",
    status: "working",
  },
];

export function getAdminModule(slug: string): AdminModule | undefined {
  return ADMIN_MODULES.find((module) => module.slug === slug);
}

export function getAdminModulesBySection(sectionId: AdminNavSectionId): AdminModule[] {
  return ADMIN_MODULES.filter((module) => module.section === sectionId);
}

export function getAdminModuleWithContent(slug: string): {
  module: AdminModule;
  content: AdminModuleContent;
} | null {
  const module = getAdminModule(slug);
  const content = getAdminModuleContent(slug);
  if (!module || !content || module.kind !== "module") return null;
  return { module, content };
}
