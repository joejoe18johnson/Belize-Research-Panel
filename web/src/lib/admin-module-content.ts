export interface AdminModuleSection {
  title: string;
  body?: string;
  bullets?: string[];
}

export interface AdminModuleLiveItem {
  label: string;
  href?: string;
  detail: string;
}

export interface AdminModuleContent {
  summary: string;
  statusLabel: string;
  statusDetail: string;
  sections: AdminModuleSection[];
  liveInPortal?: AdminModuleLiveItem[];
  adminActions?: string[];
  dataSources?: string[];
  plannedNext?: string[];
}

export interface AdminModuleContent {
  summary: string;
  statusLabel: string;
  statusDetail: string;
  sections: AdminModuleSection[];
  liveInPortal?: AdminModuleLiveItem[];
  adminActions?: string[];
  dataSources?: string[];
  plannedNext?: string[];
}

export const ADMIN_MODULE_CONTENT: Record<string, AdminModuleContent> = {
  "panelist-registration": {
    summary:
      "Eligible Belize residents complete multi-step registration with citizenship, residency, voter, demographic, interest, and contact validation. Records persist to panelists.csv.",
    statusLabel: "Live — Working MVP",
    statusDetail:
      "The Next.js registration at /register implements and extends the Streamlit MVP: phased form, duplicate blocking, photo ID handling, and consent capture.",
    liveInPortal: [
      { label: "Registration flow", href: "/register", detail: "Self-registration and authorised-person modes with eligibility gates at each phase." },
      { label: "Registration API", detail: "POST /api/register validates fields, blocks hard duplicates, and writes panelists.csv." },
      { label: "Username check", detail: "GET /api/check-username ensures unique usernames before submit." },
    ],
    sections: [
      {
        title: "Eligibility gates (aligned with MVP)",
        bullets: [
          "Age 18+ required",
          "Citizenship / residency status with ineligible categories rejected",
          "Voter registration question for citizens and Commonwealth residents in Belize",
          "District, constituency, and CTV logic for registered voters",
          "Political interests for registered voters; market and civic interests by residence",
        ],
      },
      {
        title: "Duplicate blocking at registration",
        bullets: [
          "Duplicate email",
          "Duplicate phone / WhatsApp",
          "Same first name + last name + date of birth",
          "Same photo ID type + last four digits",
        ],
      },
      {
        title: "Portal improvements over Streamlit MVP",
        bullets: [
          "Email-verified account required before panelist registration",
          "Scroll-to-phase navigation and mobile-first layout",
          "Market-only interests phase per client feedback (political/civic collected at registration when applicable)",
        ],
      },
    ],
    adminActions: [
      "Review new registrations in Admin Dashboard (filter by Pending verification)",
      "Export filtered CSV for QA against registration fields",
    ],
    dataSources: ["data/panelists.csv", "data/accounts.json", "data/uploads/"],
    plannedNext: ["Authorised-person verification code workflow in admin console"],
  },

  "panelist-login": {
    summary:
      "Panelists sign in with email and password, access the dashboard, and manage profile, surveys, rewards, and verification.",
    statusLabel: "Live — exceeds MVP",
    statusDetail:
      "Streamlit MVP showed a read-only profile on username login. The portal uses email auth, a full dashboard, editable profile (with admin approval for email/phone), and modular sections.",
    liveInPortal: [
      { label: "Panelist login", href: "/login", detail: "Email/password with session cookie and email-verification gate." },
      { label: "Dashboard overview", href: "/dashboard", detail: "Welcome, stats, survey preview, quick links." },
      { label: "Profile", href: "/dashboard/profile", detail: "View/update profile; email and phone changes require admin approval." },
      { label: "Verification Center", href: "/dashboard/verification", detail: "Phone, photo ID, and residence verification status." },
    ],
    sections: [
      {
        title: "Dashboard sections",
        bullets: [
          "Overview — stats and active survey preview",
          "Surveys — inbox and completed studies with points",
          "Profile — registration summary and contact change requests",
          "Notifications — verification and survey updates",
          "Rewards — points balance and redemption",
          "Verification Center — itemised verification checklist",
        ],
      },
      {
        title: "Account states",
        bullets: [
          "Unverified registered — dashboard access, surveys may be locked",
          "Verified — full survey and redemption eligibility",
          "On hold — email or phone change pending admin approval",
        ],
      },
    ],
    adminActions: [
      "Approve email/phone changes via admin API routes",
      "Edit verification and panelist status in Admin Dashboard",
    ],
    dataSources: ["data/accounts.json", "data/panelists.csv"],
    plannedNext: ["Staff impersonation / support view for panelist accounts"],
  },

  "rewards-loyalty": {
    summary:
      "Tracks panelist incentive points, redemption eligibility, and payout requests. The panelist-facing rewards flow is live in the Next.js portal; admin fulfillment and reporting will expand here.",
    statusLabel: "Partial — panelist live, admin manual",
    statusDetail:
      "Streamlit MVP listed this as a concept with rules overview only. The portal implements points, redemption, and requests; admin payout queue remains file-based.",
    liveInPortal: [
      {
        label: "Panelist rewards dashboard",
        href: "/dashboard/rewards",
        detail: "Shows total points, earned-to-date, available balance, reserved points from pending redemptions, and earning breakdown.",
      },
      {
        label: "Redemption flow",
        href: "/dashboard/rewards/redeem",
        detail: "Panelists redeem at 500 points = BZ$20 minimum. Options: mobile top-up (DigiCell / Smart!), gift cards, bank transfer, utility credit.",
      },
      {
        label: "Redemption API",
        detail: "POST /api/rewards/redeem validates balance, reserves points, and stores requests in data/redemption-requests.json.",
      },
    ],
    sections: [
      {
        title: "Reward rules (current)",
        bullets: [
          "Registration completed: 25 points",
          "Verified account: 50 points",
          "Survey completed: 100 points",
          "In-depth interview completed: 250 points",
          "Focus group participation: 300 points",
          "Special high-priority study: custom reward (manual assignment)",
        ],
      },
      {
        title: "Redemption options (current)",
        bullets: [
          "Mobile top-up — BZ$20 increments, DigiCell or Smart!",
          "Gift card — BZ$50 increments, retailer selection, email delivery",
          "Bank transfer — custom amount from BZ$20, account and bank details required",
          "Utility credit — BEL or BWS, account number required",
        ],
      },
      {
        title: "Balance logic",
        body:
          "Available balance = earned points minus fulfilled and pending redemptions. Points from completed surveys are summed from panelist survey records. Seed overrides in panelist-reward-balances.json support QA accounts.",
      },
      {
        title: "Fraud prevention flags (rewards)",
        bullets: [
          "Duplicate registrations and repeated contact details block registration",
          "Redemption blocked while account is on hold (pending email/phone approval)",
          "Minimum 500 points required before any redemption unlocks",
          "Future: device/IP patterns, rapid completions, referral abuse scoring",
        ],
      },
    ],
    adminActions: [
      "Review redemption requests in data/redemption-requests.json (pending / fulfilled / rejected)",
      "Adjust verification status in Admin Dashboard when fraud is suspected before payout",
      "Use panelist reward balance seeds for test accounts during pilot",
    ],
    dataSources: ["data/redemption-requests.json", "data/panelist-reward-balances.json", "data/panelist-surveys.json", "data/panelists.csv"],
    plannedNext: [
      "Admin redemption approval queue in this console",
      "Automated payout status updates and panelist notifications",
      "Loyalty tiers and bonus campaigns",
      "Reward cost vs response yield reporting",
    ],
  },

  "survey-distribution": {
    summary:
      "Creates survey assignments, targets eligible panelists, and tracks invitations, reminders, and completion rewards.",
    statusLabel: "Partial — inbox live, distribution planned",
    statusDetail:
      "Panelists receive assigned surveys in the dashboard inbox. Full admin assignment builder, multi-channel sending, and automated reminders from the Streamlit MVP are not yet ported.",
    liveInPortal: [
      {
        label: "Panelist survey inbox",
        href: "/dashboard/surveys",
        detail: "Active and completed surveys with points, due dates, progress, and external survey links.",
      },
      {
        label: "Survey data store",
        detail: "Assignments stored in data/panelist-surveys.json keyed by panelist email.",
      },
    ],
    sections: [
      {
        title: "Assignment fields (MVP design)",
        bullets: [
          "Survey name and external link (QuestionPro, Qualtrics, Google Forms, etc.)",
          "Primary delivery method: Email, WhatsApp, SMS, Facebook Messenger, external link",
          "Target group: all verified, registered voters only, constituency, market target, custom filtered sample",
          "Reminder schedule (e.g. after 3 days)",
          "Completion reward: 100 / 150 / 200 points or custom",
        ],
      },
      {
        title: "Distribution rules",
        bullets: [
          "Only verified panelists receive live surveys",
          "Avoid duplicate invitations to the same study",
          "Track invitations sent, reminders sent, and completed responses",
          "Trigger rewards after verified completion",
          "Exclude recently contacted panelists when configured",
        ],
      },
      {
        title: "Operational workflow",
        body:
          "Typical flow: define study in Sample Selection Engine → create assignment → prepare contacts in Distribution Engine → send via chosen channel → monitor completions in panelist inbox → approve rewards.",
      },
    ],
    adminActions: [
      "Assign surveys by editing data/panelist-surveys.json (pilot)",
      "Verify panelist verification_status before inviting to live studies",
      "Use Admin Dashboard filters to check geographic and voter coverage for a study",
    ],
    dataSources: ["data/panelist-surveys.json", "data/panelists.csv"],
    plannedNext: [
      "Survey assignment builder in admin console",
      "Invitation and reminder logging",
      "Automatic reward trigger on completion webhook",
      "Integration with Distribution Engine export batches",
    ],
  },

  "advanced-analytics": {
    summary:
      "Panel health, geographic coverage, political and market profiling, and operational metrics for research planning and client reporting.",
    statusLabel: "Partial — live summaries below",
    statusDetail:
      "Core district, constituency, and interest counts from the MVP Advanced Analytics module are computed live from panelists.csv on this page. Turnout modelling and operational metrics remain planned.",
    sections: [
      {
        title: "Panel health metrics",
        bullets: [
          "Total, verified, pending, and active panelists",
          "Verification status distribution",
          "Panelist status (Active, Inactive, Do not contact, Duplicate, Withdrawn)",
        ],
      },
      {
        title: "Geographic coverage",
        bullets: [
          "Panelists by district",
          "Coverage by constituency",
          "Registered voters by constituency and CTV / village area",
          "Gap analysis for under-represented areas",
        ],
      },
      {
        title: "Political analytics",
        bullets: [
          "Registered voter counts",
          "Political interest profile coverage",
          "Constituency-level voter concentration",
          "Future: turnout modelling, swing voter identification, party support tracking",
        ],
      },
      {
        title: "Market research analytics",
        bullets: [
          "Market research interest profiles",
          "Civic issue interest profiles",
          "Future: consumer segmentation, brand preference, service satisfaction",
        ],
      },
      {
        title: "Operational analytics (planned)",
        bullets: [
          "CATI productivity",
          "WhatsApp and email response rates",
          "Survey completion rates",
          "Panel retention",
          "Reward cost vs response yield",
          "Interviewer performance and project profitability",
        ],
      },
    ],
    liveInPortal: [
      {
        label: "Admin Dashboard overview",
        href: "/admin/dashboard",
        detail: "Total, verified, pending, and duplicate-warning counts with filterable panelist table.",
      },
    ],
    adminActions: [
      "Export filtered panelists CSV from Admin Dashboard for offline analysis",
      "Review duplicate and verification summaries before fieldwork",
    ],
    dataSources: ["data/panelists.csv"],
    plannedNext: [
      "Interactive charts for district and constituency coverage",
      "Registered voter analytics page",
      "Interest tag frequency reports",
      "Export to Power BI / CSV dashboards",
    ],
  },

  "fraud-prevention": {
    summary:
      "Duplicate detection, verification quality control, and admin actions to protect panel integrity before sampling and rewards.",
    statusLabel: "Live — Working MVP",
    statusDetail:
      "Matches Streamlit Fraud Prevention: duplicate email/phone/name+DOB metrics, verification summary, bulk mark action, and Admin Dashboard review table.",
    liveInPortal: [
      {
        label: "Registration duplicate blocking",
        href: "/register",
        detail: "Hard duplicates rejected at registration; possible duplicates flagged for admin review.",
      },
      {
        label: "Admin duplicate review",
        href: "/admin/dashboard",
        detail: "Duplicate review table (name + DOB), verification status editing, panelist status controls.",
      },
    ],
    sections: [
      {
        title: "Duplicate detection summary",
        bullets: [
          "Duplicate emails",
          "Duplicate phone / WhatsApp numbers",
          "Same name + date of birth clusters",
          "Photo ID type + last-4 fragment matches at registration",
        ],
      },
      {
        title: "Verification status overview",
        body:
          "Statuses: Pending, Verified, Possible Duplicate, Rejected, Needs Follow-up. Admins can bulk-mark name+DOB clusters as Possible Duplicate in the MVP workflow; same edits available per record in Admin Dashboard.",
      },
      {
        title: "Trust score categories (planned)",
        bullets: ["High Confidence", "Medium Risk", "Needs Review", "Likely Duplicate"],
      },
      {
        title: "Admin quality actions",
        bullets: [
          "Mark as verified",
          "Mark as possible duplicate",
          "Reject suspicious records",
          "Mark do not sample (panelist status)",
          "Move to inactive",
          "Request manual verification",
          "Blacklist fraudulent users (future phase)",
        ],
      },
    ],
    adminActions: [
      "Review duplicate review table in Admin Dashboard",
      "Set verification_status to Possible Duplicate, Rejected, or Verified",
      "Set panelist status to Duplicate, Do not contact, or Inactive",
      "Add admin notes on suspicious records",
    ],
    dataSources: ["data/panelists.csv", "data/accounts.json"],
    plannedNext: [
      "One-click mark name+DOB duplicates as Possible Duplicate",
      "Device / IP and rapid-registration scoring",
      "Suspicious survey completion speed alerts",
      "Referral fraud detection",
    ],
  },

  "external-data-import": {
    summary:
      "Import voter rolls, census files, customer lists, and past survey data to match against the panel, verify records, and identify coverage gaps.",
    statusLabel: "MVP workflow defined · import UI pending",
    statusDetail:
      "The Streamlit MVP supports CSV upload, column mapping, match rules, and export of match results. This admin module will host the same workflow against production panel data.",
    sections: [
      {
        title: "Supported external file types",
        bullets: [
          "Voter roll",
          "Census / population file",
          "Customer list",
          "Employee list",
          "Past survey file",
          "Other",
        ],
      },
      {
        title: "Import purposes",
        bullets: [
          "Compare only",
          "Verify existing panelists",
          "Create sample frame",
          "Update population totals",
          "Identify unmatched records",
        ],
      },
      {
        title: "Column mapping",
        bullets: [
          "First name, last name, date of birth",
          "Email, phone",
          "Constituency, district",
        ],
      },
      {
        title: "Matching options",
        bullets: [
          "Match by name + date of birth",
          "Match by email",
          "Match by phone",
          "Compare constituency",
        ],
      },
      {
        title: "Post-match actions",
        bullets: [
          "Do not import",
          "Append selected records",
          "Update existing records",
          "Export unmatched records",
        ],
      },
      {
        title: "Planned uses",
        bullets: [
          "Voter roll comparison and voter verification",
          "Customer list sampling frames",
          "Official population files for sample-size calculations",
          "Matching past survey respondents",
          "Identifying panel gaps by geography or demographics",
        ],
      },
    ],
    adminActions: [
      "Export current panel CSV from Admin Dashboard as the match target",
      "Manually review unmatched records before any append",
    ],
    plannedNext: [
      "CSV upload and column mapper in admin console",
      "Match summary dashboard and downloadable results",
      "Controlled append with audit log",
    ],
  },

  "client-project-management": {
    summary:
      "Client records, project lifecycle, methodology, sample targets, staffing, and basic financial tracking for research engagements.",
    statusLabel: "Concept · forms defined in MVP",
    statusDetail:
      "Project setup captures client type, methodology, geography, deadlines, budget, and invoice status. Persistent project storage and profitability dashboards are not yet connected.",
    sections: [
      {
        title: "Client types",
        bullets: [
          "Government agency",
          "Political party",
          "Private company",
          "NGO",
          "International organization",
          "Donor-funded project",
          "Other",
        ],
      },
      {
        title: "Project details",
        bullets: [
          "Project title and methodology (CATI, face-to-face, online, mixed mode, FGD, IDI)",
          "Target sample size and geography",
          "Status: Proposal → Approved → Fieldwork → Analysis → Reporting → Completed",
          "Fieldwork start and delivery deadline",
          "Assigned staff",
        ],
      },
      {
        title: "Financial tracking (per project)",
        bullets: [
          "Project budget (BZD)",
          "Invoice status: Not issued → Issued → Partially paid → Paid → Overdue",
          "Payment received and outstanding balance",
          "Profitability notes",
        ],
      },
    ],
    adminActions: [
      "Use Sample Selection Engine filters to confirm feasible sample for proposed geography",
      "Track panel incentive costs manually against project budget until integrated",
    ],
    plannedNext: [
      "Persistent projects database",
      "Link assignments to Distribution Engine batches",
      "Staff assignment and deadline alerts",
      "Invoicing automation",
    ],
  },

  "financial-revenue": {
    summary:
      "Revenue, cost, and profitability tracking across proposals, fieldwork, incentives, and overhead.",
    statusLabel: "Concept · calculator in MVP",
    statusDetail:
      "Manual entry of proposal value, invoices, payments, and cost categories with a live profitability snapshot. Automated invoice and trend reporting planned.",
    sections: [
      {
        title: "Revenue tracking",
        bullets: [
          "Proposal value (BZD)",
          "Invoices issued",
          "Payments received",
          "Overdue payments",
          "Repeat client count",
        ],
      },
      {
        title: "Cost tracking",
        bullets: [
          "Interviewer costs",
          "CATI / calling costs",
          "Panel incentive costs",
          "Transport / field expenses",
          "Consultant fees",
          "Administrative overhead",
        ],
      },
      {
        title: "Profitability dashboard",
        bullets: [
          "Total costs",
          "Outstanding balance (invoiced minus received)",
          "Actual profit (received minus costs)",
        ],
      },
    ],
    adminActions: [
      "Cross-check panel incentive spend with redemption-requests.json exports",
      "Set reward budgets per project manually during pilot",
    ],
    plannedNext: [
      "Monthly revenue trends",
      "Client profitability ranking",
      "Cost per completed interview",
      "ROI by survey type",
      "Automated invoice tracking",
    ],
  },

  "client-reporting": {
    summary:
      "Client-facing progress snapshots, topline findings, and deliverable packages for active and completed studies.",
    statusLabel: "Concept · snapshot UI in MVP",
    statusDetail:
      "Live client snapshot shows target vs completed interviews, response rate, and key findings. Secure client login and branded PDF exports planned.",
    sections: [
      {
        title: "Live client snapshot metrics",
        bullets: [
          "Target vs completed interviews",
          "Completion rate (%)",
          "Response rate (%)",
          "Top issue / key finding",
          "Approval rating (%)",
          "Undecided voters (%) — political studies",
        ],
      },
      {
        title: "Client deliverables",
        bullets: [
          "Topline summary",
          "Presentation-ready charts",
          "Downloadable PDF report",
          "Constituency comparison tables",
          "Demographic breakdowns",
          "Executive summary for decision-makers",
          "Progress tracker for live fieldwork",
        ],
      },
    ],
    adminActions: [
      "Export filtered sample CSVs for client appendix tables",
      "Update fieldwork counts manually until live sync exists",
    ],
    plannedNext: [
      "Secure client viewer role (read-only assigned projects)",
      "Branded PDF and chart exports",
      "Live interactive client dashboard",
    ],
  },

  "communication-notifications": {
    summary:
      "Outbound messages to panelists and clients, plus operational alerts for admins when quality or delivery thresholds are breached.",
    statusLabel: "Panelist notifications live · broadcast pending",
    statusDetail:
      "Panelists see verification, survey, and account notifications in their dashboard. Admin broadcast composer and delivery tracking from the MVP are not yet built.",
    liveInPortal: [
      {
        label: "Panelist notifications",
        href: "/dashboard/notifications",
        detail: "Unread counts, verification updates, survey invitations, and account status messages.",
      },
      {
        label: "Notifications API",
        detail: "GET /api/notifications serves panelist notification state.",
      },
      {
        label: "Email verification",
        href: "/verify-email",
        detail: "Account and email-change verification flows with on-hold messaging.",
      },
    ],
    sections: [
      {
        title: "Notification types (MVP catalog)",
        bullets: [
          "Registration confirmation",
          "Verification update",
          "Survey invitation",
          "Survey reminder",
          "Reward confirmation",
          "Payout notice",
          "Withdrawal confirmation",
          "Client progress update",
          "Invoice notice",
          "Admin alert",
        ],
      },
      {
        title: "Delivery channels",
        bullets: ["Email", "WhatsApp", "SMS", "In-app notice", "Facebook Messenger"],
      },
      {
        title: "Automatic admin alerts (planned)",
        bullets: [
          "Duplicate / fraud detection flags",
          "Low survey response rates",
          "Overdue client payments",
          "Project deadline risks",
          "Low constituency coverage",
          "Verification backlog",
          "Failed payment / reward processing",
        ],
      },
    ],
    adminActions: [
      "Approve email and phone changes via POST /api/admin/approve-email-change and approve-phone-change (x-admin-key)",
      "Monitor unread notification counts from panelist accounts during support",
    ],
    dataSources: ["Notification state per panelist session", "data/accounts.json"],
    plannedNext: [
      "Admin notification composer with audience targeting",
      "Delivery tracking, open rates, and history",
      "Reminder schedules for survey invitations",
    ],
  },

  "data-protection": {
    summary:
      "Consent, retention, withdrawal, erasure, and access controls for panelist personal data under Belize research panel policies.",
    statusLabel: "Policies live · compliance workflow partial",
    statusDetail:
      "Public data-use and site policies are published. Registration captures research, contact, and privacy consents. Account deletion and admin approval flows exist; full audit trail pending.",
    liveInPortal: [
      {
        label: "Data use policy",
        href: "/data-use-policy",
        detail: "How personal data is collected, used, shared, and retained.",
      },
      {
        label: "Site policy",
        href: "/site-policy",
        detail: "Terms of use for the panel platform.",
      },
      {
        label: "Account deletion",
        href: "/account/delete",
        detail: "Logged-in panelists can request account deletion.",
      },
      {
        label: "Verification Center",
        href: "/dashboard/verification",
        detail: "ID used for verification only; documents not stored in files per policy messaging.",
      },
    ],
    sections: [
      {
        title: "Consent types",
        bullets: [
          "Research participation consent",
          "Contact permission",
          "Privacy notice acceptance",
          "Withdrawal request",
          "Full erasure request",
          "Do not contact request",
        ],
      },
      {
        title: "Compliance controls",
        bullets: [
          "Consent history log",
          "Withdrawal tracking",
          "Anonymization / erasure requests",
          "Do-not-contact register",
          "Admin audit trail",
          "Export / download logs",
          "Restricted access to sensitive identifiers",
          "Privacy notice acknowledgement tracking",
        ],
      },
      {
        title: "Recommended status actions",
        bullets: [
          "Withdrawn → stop contact, retain minimal admin record",
          "Deceased → exclude from sampling and rewards",
          "Full erasure → remove direct identifiers where legally allowed",
          "Do not contact → preserve record but block outreach",
        ],
      },
    ],
    adminActions: [
      "Set panelist status to Withdrawn or Do not contact in Admin Dashboard",
      "Process deletion requests and document in admin notes",
      "Restrict exports of password hashes (stripped from admin CSV export)",
    ],
    dataSources: ["data/panelists.csv", "data/accounts.json", "Consent fields on registration"],
    plannedNext: [
      "Automated audit trails and export logs",
      "Formal anonymization workflows",
      "Compliance reporting dashboard",
    ],
  },

  "fieldwork-management": {
    summary:
      "Interviewer assignments, productivity monitoring, callbacks, refusals, and supervisor quality control for CATI and face-to-face studies.",
    statusLabel: "Concept · MVP forms defined",
    statusDetail:
      "Interviewer targets, completion counts, and supervisor review flags are specified in the MVP. GPS tracking, CATI logs, and live performance scoring are planned.",
    sections: [
      {
        title: "Assignment types",
        bullets: [
          "CATI (telephone interviewing)",
          "Face-to-face interviewing",
          "Online follow-up",
          "Supervisor review",
        ],
      },
      {
        title: "Interviewer metrics",
        bullets: [
          "Assigned area / territory",
          "Daily interview target",
          "Completed interviews",
          "Refusals",
          "Callback list size",
          "Productivity score (completed vs target)",
        ],
      },
      {
        title: "Supervisor review flags",
        bullets: [
          "Unusually fast completions",
          "Suspicious repeated responses",
          "Missed quotas",
          "Geographic coverage gaps",
          "Incomplete interviews",
          "Failed callbacks",
          "Unusual refusal patterns",
          "Spot-check verification needed",
        ],
      },
    ],
    adminActions: [
      "Export contact batches from Distribution Engine (when live) for interviewer assignment",
      "Flag suspicious panelists via verification_status and notes",
    ],
    plannedNext: [
      "GPS verification and live interviewer tracking",
      "CATI call logs",
      "Supervisor spot checks",
      "Automated interviewer performance scoring",
    ],
  },

  "user-roles": {
    summary:
      "Staff roles, access scopes, and security controls for admin, operations, research, field, finance, and client viewer accounts.",
    statusLabel: "Admin password gate live · RBAC pending",
    statusDetail:
      "Admin console uses a shared admin password session today. Role-based staff accounts, 2FA, and permission enforcement are planned.",
    liveInPortal: [
      {
        label: "Admin login",
        href: "/admin/login",
        detail: "Password-protected session (ADMIN_PASSWORD env). Separate from panelist auth.",
      },
    ],
    sections: [
      {
        title: "Roles (MVP design)",
        bullets: [
          "Super Admin — full platform access",
          "Operations Manager — panel, sampling, survey, fieldwork",
          "Research Analyst — analytics, reporting, client dashboards",
          "Field Supervisor — interviewer monitoring and QC only",
          "Finance Officer — billing, invoices, profitability",
          "Client Viewer — read-only assigned reports",
        ],
      },
      {
        title: "Access scopes",
        bullets: [
          "Full platform",
          "Assigned projects only",
          "Read only",
          "Restricted financial access",
          "Restricted compliance access",
        ],
      },
      {
        title: "Security controls (recommended)",
        bullets: [
          "Password policy enforcement",
          "Role-based access restrictions",
          "Audit trail for admin actions",
          "Login history review",
          "Export / download restrictions",
          "Approval workflow for sensitive actions",
          "Forced logout for inactive sessions",
        ],
      },
    ],
    adminActions: [
      "Rotate ADMIN_PASSWORD and AUTH_SESSION_SECRET before production launch",
      "Use ADMIN_API_KEY for contact-change approval routes",
    ],
    plannedNext: [
      "Persistent staff accounts per role",
      "Module-level permission enforcement",
      "Two-factor authentication",
      "Access and action audit logs",
    ],
  },

  "backup-recovery": {
    summary:
      "Backup frequency, encryption, off-site storage, and recovery procedures for panel data and project files.",
    statusLabel: "Manual · file-based storage",
    statusDetail:
      "Panel data lives in CSV/JSON under web/data/. Automated scheduled backups and restore UI are not yet configured; Git and host backups should be used during development.",
    sections: [
      {
        title: "Critical data files",
        bullets: [
          "data/panelists.csv — master panel register",
          "data/accounts.json — auth accounts",
          "data/panelist-surveys.json — survey assignments",
          "data/redemption-requests.json — payout requests",
          "data/panelist-reward-balances.json — balance seeds",
          "data/uploads/ — registration documents",
        ],
      },
      {
        title: "Backup configuration (MVP targets)",
        bullets: [
          "Database backup: daily / twice daily / weekly",
          "Full system backup: weekly / bi-weekly / monthly",
          "Off-site backup storage",
          "Backup encryption",
          "Version history retention (30 days – 1 year)",
        ],
      },
      {
        title: "Recovery actions",
        bullets: [
          "Restore deleted panelist records",
          "Rollback failed imports",
          "Recover overwritten project files",
          "Restore previous backup version",
          "Emergency recovery after server failure",
          "Audit log of restore actions",
        ],
      },
      {
        title: "Business continuity",
        bullets: [
          "Backup admin access",
          "Succession access for ownership",
          "Emergency contact chain",
          "Contingency plans for active projects",
          "Internet / power outage procedures",
          "Cyberattack / ransomware response protocol",
        ],
      },
    ],
    adminActions: [
      "Download filtered panel CSV from Admin Dashboard before major imports",
      "Keep Netlify/host environment secrets documented offline",
    ],
    plannedNext: [
      "Automated scheduled backups to cloud storage",
      "Live restore testing and disaster recovery drills",
      "Recovery audit reporting in admin console",
    ],
  },

  "system-settings": {
    summary:
      "Platform defaults for sampling, rewards, duplicate detection, fraud alerts, sessions, and branding.",
    statusLabel: "Partially configured via env · UI pending",
    statusDetail:
      "Many settings are environment variables or code constants today. A unified settings page will centralize operational defaults from the MVP.",
    sections: [
      {
        title: "Core platform defaults (MVP)",
        bullets: [
          "Default confidence level: 90% / 95% / 99%",
          "Default expected response rate (e.g. 40%)",
          "Default survey completion reward points (100)",
          "Inactive panelist rule (e.g. 180 days)",
          "Duplicate detection sensitivity: Strict / Balanced / Lenient",
          "Fraud alert sensitivity: High / Medium / Low",
          "Reward points expiry (e.g. 365 days)",
        ],
      },
      {
        title: "Security & access",
        bullets: [
          "Password policy (minimum length, strength, 2FA)",
          "Session timeout (minutes)",
          "AUTH_SESSION_SECRET and ADMIN_PASSWORD via environment",
        ],
      },
      {
        title: "Reporting & branding (planned)",
        bullets: [
          "Company logo upload",
          "Branded PDF reports",
          "Client dashboard branding",
          "Email, WhatsApp, invoice, and presentation templates",
        ],
      },
    ],
    liveInPortal: [
      {
        label: "Reward constants",
        detail: "500 points = BZ$20, minimum 500 to redeem — configured in reward-redemption.ts",
      },
      {
        label: "Text logo mode",
        detail: "NEXT_PUBLIC_USE_TEXT_LOGO for faster testing without PNG logos",
      },
    ],
    adminActions: [
      "Set ADMIN_PASSWORD, AUTH_SESSION_SECRET, ENABLE_DEMO_ACCOUNTS in deployment env",
      "Toggle NEXT_PUBLIC_SHOW_ADMIN_ENTRY when moving to private admin links only",
    ],
    plannedNext: [
      "Persistent settings store editable from this console",
      "Branding upload and template editor",
      "Gateway integration toggles",
    ],
  },

  "api-integrations": {
    summary:
      "Connections to survey platforms, messaging channels, payout providers, analytics tools, and security services.",
    statusLabel: "Internal APIs live · external webhooks pending",
    statusDetail:
      "Next.js API routes handle auth, registration, profile, rewards, notifications, and admin approval. External survey and messaging integrations are planned.",
    sections: [
      {
        title: "Survey platform integrations",
        bullets: [
          "QuestionPro, Qualtrics, SurveyMonkey, Google Forms, KoboToolbox, ODK, custom CATI",
          "Status: Connected / Planned / Testing / Not configured",
        ],
      },
      {
        title: "Communication integrations",
        bullets: [
          "WhatsApp Business API",
          "SMS gateway",
          "Email service (transactional)",
          "Facebook Messenger",
        ],
      },
      {
        title: "Payment & analytics",
        bullets: [
          "Reward payout: bank transfer workflow, mobile top-up, gift cards, manual processing",
          "Analytics: Power BI, Tableau, R/Shiny, Python pipeline, internal dashboard",
        ],
      },
      {
        title: "Security & storage (future)",
        bullets: [
          "Cloud backup providers",
          "Secure document storage",
          "Identity verification services",
          "Automated fraud detection APIs",
          "Disaster recovery services",
          "External audit reporting",
        ],
      },
    ],
    liveInPortal: [
      { label: "Auth", detail: "POST /api/auth/login, signup, logout · GET /api/auth/me" },
      { label: "Registration", detail: "POST /api/register · GET /api/check-username" },
      { label: "Profile", detail: "GET/PATCH /api/profile · email/phone change request routes" },
      { label: "Rewards", detail: "POST /api/rewards/redeem · GET/PATCH /api/rewards/points" },
      { label: "Admin approval", detail: "POST /api/admin/approve-email-change · approve-phone-change (x-admin-key)" },
    ],
    plannedNext: [
      "Survey platform webhooks for completion sync",
      "WhatsApp / SMS invitation sending",
      "Automatic reward trigger on external completion",
    ],
  },

  "deployment-production": {
    summary:
      "Hosting, database, security, and launch checklist for moving from CSV-based development to production operations.",
    statusLabel: "Netlify deployment configured",
    statusDetail:
      "Next.js app deploys via netlify.toml (base web, Next plugin). Panel data remains file-based until PostgreSQL migration.",
    sections: [
      {
        title: "Hosting & infrastructure",
        bullets: [
          "Current: Netlify with @netlify/plugin-nextjs",
          "Options: Cloud VPS, managed platform, dedicated server, hybrid",
          "Database target: PostgreSQL (replacing CSV for production)",
          "Custom domain and HTTPS required for launch",
        ],
      },
      {
        title: "Security & access",
        bullets: [
          "HTTPS / SSL",
          "Secure admin authentication (move beyond shared password)",
          "Environment variable protection (AUTH_SESSION_SECRET, ADMIN_PASSWORD, ADMIN_API_KEY)",
          "Automated backups enabled",
        ],
      },
      {
        title: "Production checklist",
        bullets: [
          "Error logging enabled",
          "User activity logs enabled",
          "Deployment documentation completed",
          "Testing checklist completed",
          "Launch checklist approved",
          "Disaster recovery process tested",
          "Admin access review completed",
          "Live notification channels tested",
          "Backup restore test completed",
        ],
      },
      {
        title: "Launch status stages",
        bullets: [
          "Development",
          "Internal testing",
          "Pilot launch",
          "Full production",
        ],
      },
    ],
    liveInPortal: [
      {
        label: "Netlify config",
        detail: "Root netlify.toml — base = web, publish = .next, plugin nextjs",
      },
      {
        label: "Required env",
        detail: "AUTH_SESSION_SECRET · ADMIN_PASSWORD for admin console",
      },
    ],
    adminActions: [
      "Verify build with npm run build before each deploy",
      "Confirm Netlify publish directory is .next (not web/)",
      "Disable demo accounts in production (ENABLE_DEMO_ACCOUNTS=false)",
    ],
    plannedNext: [
      "PostgreSQL migration",
      "Staging environment with anonymized panel copy",
      "Error monitoring (e.g. Sentry) and uptime checks",
    ],
  },

  "sample-selection": {
    summary:
      "Filter the panel, calculate required sample sizes, and generate random samples for survey fieldwork.",
    statusLabel: "Streamlit MVP — use appfiles/app.py",
    statusDetail:
      "Full sampling methods, filters, sample size calculator, and CSV export run in the Streamlit app today. Admin Dashboard filter + CSV export is the interim Next.js workflow until this engine is ported.",
    sections: [
      {
        title: "Sampling methods",
        bullets: [
          "Simple random sample",
          "Stratified sample",
          "Quota sample",
          "Controlled sample",
          "Cluster sample (placeholder until EA / zone variable available)",
        ],
      },
      {
        title: "Filter dimensions",
        bullets: [
          "Geography: district, constituency, city/town/village, place of residence",
          "Demographics: sex, ethnicity, education, age range / age group (18–24 through 65+)",
          "Voter status and citizenship",
          "Verification and panelist status",
          "Interest tags: political, market, civic",
        ],
      },
      {
        title: "Sample size calculator",
        bullets: [
          "Eligible pool count after filters (auto from panel or manual population override)",
          "Margin of error (%), confidence level (90/95/99%)",
          "Expected response rate (%)",
          "Required completes and contacts needed after response-rate adjustment",
          "Manual override of contact sample size",
          "Warning when contacts exceed available filtered panel",
        ],
      },
      {
        title: "Sample export columns",
        bullets: [
          "Name, residence, district, city, constituency, CTV area",
          "Sex, age, age group",
          "Phone, email, verification status",
        ],
      },
    ],
    liveInPortal: [
      {
        label: "Admin Dashboard filters",
        href: "/admin/dashboard",
        detail: "Subset of geographic and verification filters available today for manual sample review.",
      },
    ],
    adminActions: [
      "Use Admin Dashboard filters and CSV export as interim sample workflow",
      "Confirm eligible pool count before promising sample to clients",
    ],
    dataSources: ["data/panelists.csv"],
    plannedNext: [
      "Port Sample Selection Engine UI to admin console",
      "Persist sample batches and link to Distribution Engine",
      "Stratified and quota allocation rules beyond random MVP behavior",
    ],
  },

  "distribution-engine": {
    summary:
      "Prepare outreach batches and invitation exports from survey assignments and sample batches.",
    statusLabel: "Streamlit MVP — use appfiles/app.py",
    statusDetail:
      "Outreach batch export with distribution modes and invitation messages is implemented in the Streamlit MVP (survey_assignments.csv, sample_batch_members.csv, distribution_log.csv). Port to Next.js admin is planned.",
    sections: [
      {
        title: "Distribution modes",
        bullets: ["WhatsApp", "Email", "SMS", "Facebook Messenger", "Other"],
      },
      {
        title: "Workflow",
        bullets: [
          "Select survey assignment (ID + survey title)",
          "Load linked sample batch members",
          "Choose distribution mode",
          "Enter survey link and invitation message",
          "Prepare distribution export with distribution ID",
          "Download contact CSV for sending",
          "Append to distribution_log.csv",
        ],
      },
      {
        title: "Export contact fields",
        bullets: [
          "First name, last name",
          "Phone / WhatsApp, email",
          "Facebook, Instagram, TikTok",
          "District, constituency",
          "Survey link and distribution mode",
        ],
      },
    ],
    adminActions: [
      "Manually send invitations using CSV export from Admin Dashboard until engine is ported",
      "Log sends externally until distribution_log is migrated",
    ],
    dataSources: [
      "survey_assignments.csv (Streamlit MVP)",
      "sample_batch_members.csv (Streamlit MVP)",
      "distribution_log.csv (Streamlit MVP)",
    ],
    plannedNext: [
      "Port Distribution Engine to admin console",
      "Connect to Sample Selection batch output",
      "Track invitation and reminder status per panelist",
    ],
  },
};

export function getAdminModuleContent(slug: string): AdminModuleContent | undefined {
  return ADMIN_MODULE_CONTENT[slug];
}
