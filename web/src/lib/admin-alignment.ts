/**
 * MVP (appfiles/app.py) vs Next.js portal alignment.
 * Status reflects what is operational today, not the original Streamlit label alone.
 */
export type MvpModuleStatus =
  | "working"
  | "partial"
  | "planned"
  | "streamlit-only";

export interface MvpAlignmentEntry {
  slug: string;
  mvpLabel: string;
  mvpOriginalStatus: string;
  portalStatus: MvpModuleStatus;
  rationale: string;
}

export const MVP_ALIGNMENT: MvpAlignmentEntry[] = [
  {
    slug: "panelist-registration",
    mvpLabel: "Panelist Registration",
    mvpOriginalStatus: "Working MVP",
    portalStatus: "working",
    rationale: "Multi-step registration, eligibility checks, duplicate blocking, and panelists.csv persistence are live at /register.",
  },
  {
    slug: "panelist-login",
    mvpLabel: "Panelist Login",
    mvpOriginalStatus: "Working MVP",
    portalStatus: "working",
    rationale: "Email/password auth, verified session, and full dashboard exceed MVP read-only profile (profile edit, verification center, surveys, rewards).",
  },
  {
    slug: "admin-dashboard",
    mvpLabel: "Admin Dashboard",
    mvpOriginalStatus: "Working MVP",
    portalStatus: "working",
    rationale: "Overview metrics, filters, duplicate review, CSV export, and record editing match MVP admin dashboard behaviour.",
  },
  {
    slug: "fraud-prevention",
    mvpLabel: "Fraud Prevention",
    mvpOriginalStatus: "Working MVP / improving",
    portalStatus: "working",
    rationale: "Dedicated /admin/fraud-prevention page with duplicate metrics, sortable duplicate tables by type, verification breakdown, and bulk mark action.",
  },
  {
    slug: "advanced-analytics",
    mvpLabel: "Advanced Analytics",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Dedicated /admin/analytics page with MVP-aligned panel health, geography, political, and interest breakdowns — filters, charts, and sortable tables.",
  },
  {
    slug: "rewards-loyalty",
    mvpLabel: "Rewards & Loyalty",
    mvpOriginalStatus: "Concept module",
    portalStatus: "partial",
    rationale: "MVP was overview-only. Portal has points, redemption catalog, and requests; admin fulfillment queue still manual.",
  },
  {
    slug: "survey-distribution",
    mvpLabel: "Survey Distribution",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Dedicated /admin/survey-distribution page with assignment metrics, filterable assignment table, status charts, and distribution planner preview aligned with the MVP.",
  },
  {
    slug: "sample-selection",
    mvpLabel: "Sample Selection Engine",
    mvpOriginalStatus: "MVP / to refine later",
    portalStatus: "working",
    rationale: "Dedicated /admin/sample-selection page with MVP filters, sample size calculator, random sample generation, and CSV export.",
  },
  {
    slug: "distribution-engine",
    mvpLabel: "Distribution Engine",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Dedicated /admin/distribution-engine page with live outreach batch preview and CSV export from survey assignments.",
  },
  {
    slug: "communication-notifications",
    mvpLabel: "Communication & Notifications",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Live notification read-state, verification backlog, and admin approval queue counts from accounts and panel data.",
  },
  {
    slug: "data-protection",
    mvpLabel: "Data Protection & Compliance",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Consent rates, panelist status distribution, and auth account compliance metrics computed from the live register.",
  },
  {
    slug: "deployment-production",
    mvpLabel: "Deployment & Production",
    mvpOriginalStatus: "Concept module",
    portalStatus: "partial",
    rationale: "Live production checklist and hosting inventory; PostgreSQL migration and automated backups remain pending.",
  },
  {
    slug: "api-integrations",
    mvpLabel: "API & Integrations",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Live internal API route registry with planned external connector catalog from the MVP.",
  },
  {
    slug: "external-data-import",
    mvpLabel: "External Data Import & Matching",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Panel match-field coverage, geography gap analysis, and CSV upload matching against the live register.",
  },
  {
    slug: "client-project-management",
    mvpLabel: "Client & Project Management",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Study project board derived from live survey assignments with completion and geography metrics.",
  },
  {
    slug: "financial-revenue",
    mvpLabel: "Financial & Revenue",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Point liability and redemption ledger computed from panel rewards data and payout requests.",
  },
  {
    slug: "client-reporting",
    mvpLabel: "Client Reporting Portal",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Per-study client snapshots with target vs completed interviews and completion rates from assignment records.",
  },
  {
    slug: "fieldwork-management",
    mvpLabel: "Fieldwork Management",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "District-level fieldwork productivity board from live survey assignments.",
  },
  {
    slug: "user-roles",
    mvpLabel: "User Roles & Permissions",
    mvpOriginalStatus: "Concept module",
    portalStatus: "partial",
    rationale: "MVP role matrix with live account counts; persistent staff RBAC not yet deployed.",
  },
  {
    slug: "backup-recovery",
    mvpLabel: "Backup & Recovery",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Live data file inventory with sizes, record counts, and last-modified timestamps.",
  },
  {
    slug: "system-settings",
    mvpLabel: "System Settings",
    mvpOriginalStatus: "Concept module",
    portalStatus: "working",
    rationale: "Operational defaults and environment flags surfaced from code constants and deployment config.",
  },
];

export function getMvpAlignment(slug: string): MvpAlignmentEntry | undefined {
  return MVP_ALIGNMENT.find((entry) => entry.slug === slug);
}

export function portalStatusLabel(status: MvpModuleStatus): string {
  switch (status) {
    case "working":
      return "Live — matches MVP scope";
    case "partial":
      return "Partial — portal ahead of or behind MVP in areas";
    case "streamlit-only":
      return "Streamlit MVP — use appfiles/app.py until ported";
    default:
      return "Planned — MVP spec only";
  }
}
