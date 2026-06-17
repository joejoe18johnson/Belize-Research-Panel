import type { AdminModuleContent } from "./admin-module-content";
import { getAdminModuleContent } from "./admin-module-content";

export type AdminModuleKind = "page" | "module";

export type AdminModuleStatus = "working" | "partial" | "planned" | "streamlit";

export interface AdminModule {
  slug: string;
  label: string;
  kind: AdminModuleKind;
  href?: string;
  /** Opens the panelist-facing flow in a new tab when set. */
  externalHref?: string;
  status?: AdminModuleStatus;
}

/**
 * Sidebar order matches appfiles/app.py (excluding removed MVP handoff items).
 * Admin Dashboard is second-to-last; Distribution Engine is last — same as Streamlit MVP.
 */
export const ADMIN_MODULES: AdminModule[] = [
  {
    slug: "survey-distribution",
    label: "Survey Distribution",
    kind: "page",
    href: "/admin/survey-distribution",
    status: "working",
  },
  {
    slug: "advanced-analytics",
    label: "Advanced Analytics",
    kind: "page",
    href: "/admin/analytics",
    status: "working",
  },
  {
    slug: "fraud-prevention",
    label: "Fraud Prevention",
    kind: "page",
    href: "/admin/fraud-prevention",
    status: "working",
  },
  {
    slug: "external-data-import",
    label: "External Data Import & Matching",
    kind: "page",
    href: "/admin/external-data-import",
    status: "working",
  },
  {
    slug: "client-project-management",
    label: "Client & Project Management",
    kind: "page",
    href: "/admin/client-project-management",
    status: "working",
  },
  {
    slug: "financial-revenue",
    label: "Financial & Revenue",
    kind: "page",
    href: "/admin/financial-revenue",
    status: "working",
  },
  {
    slug: "client-reporting",
    label: "Client Reporting Portal",
    kind: "page",
    href: "/admin/client-reporting",
    status: "working",
  },
  {
    slug: "communication-notifications",
    label: "Communication & Notifications",
    kind: "page",
    href: "/admin/communication-notifications",
    status: "working",
  },
  {
    slug: "data-protection",
    label: "Data Protection & Compliance",
    kind: "page",
    href: "/admin/data-protection",
    status: "working",
  },
  {
    slug: "fieldwork-management",
    label: "Fieldwork Management",
    kind: "page",
    href: "/admin/fieldwork-management",
    status: "working",
  },
  {
    slug: "user-roles",
    label: "User Roles & Permissions",
    kind: "page",
    href: "/admin/user-roles",
    status: "working",
  },
  {
    slug: "backup-recovery",
    label: "Backup & Recovery",
    kind: "page",
    href: "/admin/backup-recovery",
    status: "working",
  },
  {
    slug: "system-settings",
    label: "System Settings",
    kind: "page",
    href: "/admin/system-settings",
    status: "working",
  },
  {
    slug: "api-integrations",
    label: "API & Integrations",
    kind: "page",
    href: "/admin/api-integrations",
    status: "working",
  },
  {
    slug: "deployment-production",
    label: "Deployment & Production",
    kind: "page",
    href: "/admin/deployment-production",
    status: "working",
  },
  {
    slug: "sample-selection",
    label: "Sample Selection Engine",
    kind: "page",
    href: "/admin/sample-selection",
    status: "working",
  },
  {
    slug: "admin-dashboard",
    label: "Admin Dashboard",
    kind: "page",
    href: "/admin/dashboard",
    status: "working",
  },
  {
    slug: "distribution-engine",
    label: "Distribution Engine",
    kind: "page",
    href: "/admin/distribution-engine",
    status: "working",
  },
];

export function getAdminModule(slug: string): AdminModule | undefined {
  return ADMIN_MODULES.find((module) => module.slug === slug);
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
