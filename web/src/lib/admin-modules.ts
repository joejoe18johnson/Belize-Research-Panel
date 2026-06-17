import type { AdminModuleContent } from "./admin-module-content";
import { getAdminModuleContent } from "./admin-module-content";

export type AdminModuleKind = "page" | "external" | "module";

export type AdminModuleStatus = "working" | "partial" | "planned";

export interface AdminModule {
  slug: string;
  label: string;
  kind: AdminModuleKind;
  href?: string;
  status?: AdminModuleStatus;
}

/** Sidebar navigation aligned with the Streamlit MVP in appfiles/app.py */
export const ADMIN_MODULES: AdminModule[] = [
  {
    slug: "panelist-registration",
    label: "Panelist Registration",
    kind: "external",
    href: "/register",
    status: "working",
  },
  {
    slug: "panelist-login",
    label: "Panelist Login",
    kind: "external",
    href: "/login",
    status: "working",
  },
  {
    slug: "rewards-loyalty",
    label: "Rewards & Loyalty",
    kind: "module",
    status: "partial",
  },
  {
    slug: "survey-distribution",
    label: "Survey Distribution",
    kind: "module",
    status: "partial",
  },
  {
    slug: "advanced-analytics",
    label: "Advanced Analytics",
    kind: "module",
    status: "planned",
  },
  {
    slug: "fraud-prevention",
    label: "Fraud Prevention",
    kind: "module",
    status: "partial",
  },
  {
    slug: "external-data-import",
    label: "External Data Import & Matching",
    kind: "module",
    status: "planned",
  },
  {
    slug: "client-project-management",
    label: "Client & Project Management",
    kind: "module",
    status: "planned",
  },
  {
    slug: "financial-revenue",
    label: "Financial & Revenue",
    kind: "module",
    status: "planned",
  },
  {
    slug: "client-reporting",
    label: "Client Reporting Portal",
    kind: "module",
    status: "planned",
  },
  {
    slug: "communication-notifications",
    label: "Communication & Notifications",
    kind: "module",
    status: "partial",
  },
  {
    slug: "data-protection",
    label: "Data Protection & Compliance",
    kind: "module",
    status: "partial",
  },
  {
    slug: "fieldwork-management",
    label: "Fieldwork Management",
    kind: "module",
    status: "planned",
  },
  {
    slug: "user-roles",
    label: "User Roles & Permissions",
    kind: "module",
    status: "planned",
  },
  {
    slug: "backup-recovery",
    label: "Backup & Recovery",
    kind: "module",
    status: "planned",
  },
  {
    slug: "system-settings",
    label: "System Settings",
    kind: "module",
    status: "planned",
  },
  {
    slug: "api-integrations",
    label: "API & Integrations",
    kind: "module",
    status: "partial",
  },
  {
    slug: "deployment-production",
    label: "Deployment & Production",
    kind: "module",
    status: "partial",
  },
  {
    slug: "sample-selection",
    label: "Sample Selection Engine",
    kind: "module",
    status: "planned",
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
    kind: "module",
    status: "planned",
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
