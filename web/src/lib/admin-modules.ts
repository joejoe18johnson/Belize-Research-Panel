export type AdminModuleKind = "page" | "external" | "placeholder";

export type AdminModuleStatus = "working" | "mvp" | "concept";

export interface AdminModule {
  slug: string;
  label: string;
  kind: AdminModuleKind;
  href?: string;
  status?: AdminModuleStatus;
  description?: string;
}

/** Sidebar navigation aligned with the Streamlit MVP in appfiles/app.py */
export const ADMIN_MODULES: AdminModule[] = [
  {
    slug: "mvp-status",
    label: "MVP Status & Handoff Checklist",
    kind: "page",
    href: "/admin/mvp-status",
    status: "working",
  },
  {
    slug: "mvp-packaging",
    label: "MVP Packaging & Developer Handoff",
    kind: "placeholder",
    status: "concept",
    description: "ZIP-ready folder structure, requirements, and developer handoff notes from the Streamlit MVP.",
  },
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
    kind: "placeholder",
    status: "concept",
    description: "Points accrual, redemption catalog, and loyalty tiers — panelist rewards live in the Next.js portal.",
  },
  {
    slug: "survey-distribution",
    label: "Survey Distribution",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "advanced-analytics",
    label: "Advanced Analytics",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "fraud-prevention",
    label: "Fraud Prevention",
    kind: "placeholder",
    status: "mvp",
    description: "Trust scoring, duplicate detection, and admin quality actions from the MVP fraud module.",
  },
  {
    slug: "external-data-import",
    label: "External Data Import & Matching",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "client-project-management",
    label: "Client & Project Management",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "financial-revenue",
    label: "Financial & Revenue",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "client-reporting",
    label: "Client Reporting Portal",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "communication-notifications",
    label: "Communication & Notifications",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "data-protection",
    label: "Data Protection & Compliance",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "fieldwork-management",
    label: "Fieldwork Management",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "user-roles",
    label: "User Roles & Permissions",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "backup-recovery",
    label: "Backup & Recovery",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "system-settings",
    label: "System Settings",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "api-integrations",
    label: "API & Integrations",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "deployment-production",
    label: "Deployment & Production",
    kind: "placeholder",
    status: "concept",
  },
  {
    slug: "sample-selection",
    label: "Sample Selection Engine",
    kind: "placeholder",
    status: "mvp",
    description: "Sample size calculator and batch selection from the Streamlit MVP.",
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
    kind: "placeholder",
    status: "concept",
    description: "Outreach batches and invitation exports for survey assignments.",
  },
];

export function getAdminModule(slug: string): AdminModule | undefined {
  return ADMIN_MODULES.find((module) => module.slug === slug);
}

export const MVP_MODULE_CHECKLIST: { module: string; status: string }[] = [
  { module: "Panelist Registration", status: "Working MVP" },
  { module: "Panelist Login", status: "Working MVP" },
  { module: "Admin Dashboard", status: "Working MVP" },
  { module: "Fraud Prevention", status: "Working MVP / improving" },
  { module: "Sample Selection Engine", status: "MVP / to refine later" },
  { module: "Rewards & Loyalty", status: "Concept module" },
  { module: "Survey Distribution", status: "Concept module" },
  { module: "Advanced Analytics", status: "Concept module" },
  { module: "Client & Project Management", status: "Concept module" },
  { module: "Financial & Revenue", status: "Concept module" },
  { module: "Client Reporting Portal", status: "Concept module" },
  { module: "Communication & Notifications", status: "Concept module" },
  { module: "Data Protection & Compliance", status: "Concept module" },
  { module: "Fieldwork Management", status: "Concept module" },
  { module: "User Roles & Permissions", status: "Concept module" },
  { module: "Backup & Recovery", status: "Concept module" },
  { module: "System Settings", status: "Concept module" },
  { module: "API & Integrations", status: "Concept module" },
  { module: "Deployment & Production", status: "Concept module" },
];
