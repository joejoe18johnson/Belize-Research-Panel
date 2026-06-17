import { duplicateNameDobKey } from "./admin-panelists";
import type { AdminDataHub } from "./admin-data-hub";
import { formatBytes, formatDateTime, panelistByEmailMap } from "./admin-data-hub";
import type { AdminCountRow, AdminModuleSnapshot } from "./admin-snapshot-types";
import type { PanelistRow } from "./panelists";
import { isSurveyOverdue } from "./panelist-surveys-types";
import {
  DEFAULT_REWARD_SETTINGS,
  redemptionRateLabel,
} from "./reward-settings";
import { cleanText } from "./validation";

export const DATA_MODULE_SLUGS = [
  "external-data-import",
  "client-project-management",
  "financial-revenue",
  "client-reporting",
  "communication-notifications",
  "data-protection",
  "fieldwork-management",
  "user-roles",
  "backup-recovery",
  "system-settings",
  "api-integrations",
  "deployment-production",
  "distribution-engine",
] as const;

export type DataModuleSlug = (typeof DATA_MODULE_SLUGS)[number];

export interface DistributionExportRow {
  distributionId: string;
  surveyTitle: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  district: string;
  constituency: string;
  surveyUrl: string;
  mode: string;
}

export interface PanelMatchIndex {
  emails: string[];
  phones: string[];
  nameDobKeys: string[];
}

function pct(count: number, total: number): number {
  return total ? Math.round((count / total) * 1000) / 10 : 0;
}

function countRows(rows: PanelistRow[], field: keyof PanelistRow): AdminCountRow[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = cleanText(row[field]) || "Unknown";
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  const total = rows.length || 1;
  return [...map.entries()]
    .map(([label, count]) => ({ label, count, percent: pct(count, total) }))
    .sort((a, b) => b.count - a.count);
}

function boolCount(rows: PanelistRow[], field: keyof PanelistRow, truthy = "True"): { yes: number; no: number } {
  let yes = 0;
  for (const row of rows) {
    if (cleanText(row[field]).toLowerCase() === truthy.toLowerCase()) yes += 1;
  }
  return { yes, no: rows.length - yes };
}

function surveyProjects(hub: AdminDataHub) {
  const bySurvey = new Map<
    string,
    { title: string; category: string; assigned: number; completed: number; inProgress: number; overdue: number; districts: Set<string> }
  >();
  const panelists = panelistByEmailMap(hub.panelists);

  for (const record of hub.surveyRecords) {
    const key = record.id;
    const entry = bySurvey.get(key) ?? {
      title: record.title,
      category: record.category,
      assigned: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
      districts: new Set<string>(),
    };
    entry.assigned += 1;
    if (record.status === "completed") entry.completed += 1;
    if (record.status === "in_progress") entry.inProgress += 1;
    if (isSurveyOverdue(record)) entry.overdue += 1;
    const email = cleanText(record.panelistEmail).toLowerCase();
    const district = cleanText(panelists.get(email)?.district);
    if (district) entry.districts.add(district);
    bySurvey.set(key, entry);
  }
  return [...bySurvey.values()].sort((a, b) => b.assigned - a.assigned);
}

function incentiveLiability(hub: AdminDataHub) {
  const verified = hub.panelists.filter((row) => cleanText(row.verification_status) === "Verified").length;
  const registrationPoints = hub.panelists.length * DEFAULT_REWARD_SETTINGS.registrationRewardPoints;
  const verificationPoints = verified * DEFAULT_REWARD_SETTINGS.verificationRewardPoints;
  const surveyPoints = hub.surveyRecords
    .filter((record) => record.status === "completed")
    .reduce((sum, record) => sum + record.points, 0);
  const pendingRedemptions = hub.redemptionRequests.filter((request) => request.status === "pending");
  const fulfilledRedemptions = hub.redemptionRequests.filter((request) => request.status === "fulfilled");
  const pendingPoints = pendingRedemptions.reduce((sum, request) => sum + request.points, 0);
  const fulfilledPoints = fulfilledRedemptions.reduce((sum, request) => sum + request.points, 0);
  const fulfilledBz = fulfilledRedemptions.reduce(
    (sum, request) => sum + (request.amountBz ?? request.points / DEFAULT_REWARD_SETTINGS.pointsPerBzDollar),
    0
  );
  const pendingBz = pendingRedemptions.reduce(
    (sum, request) => sum + (request.amountBz ?? request.points / DEFAULT_REWARD_SETTINGS.pointsPerBzDollar),
    0
  );
  return {
    registrationPoints,
    verificationPoints,
    surveyPoints,
    totalEarned: registrationPoints + verificationPoints + surveyPoints,
    pendingPoints,
    fulfilledPoints,
    fulfilledBz,
    pendingBz,
  };
}

function buildExternalDataImport(hub: AdminDataHub): AdminModuleSnapshot {
  const rows = hub.panelists;
  const withEmail = rows.filter((row) => cleanText(row.email)).length;
  const withPhone = rows.filter((row) => cleanText(row.phone_whatsapp)).length;
  const withConstituency = rows.filter((row) => cleanText(row.constituency)).length;
  const withDob = rows.filter((row) => cleanText(row.dob)).length;

  const emailGroups = new Map<string, number>();
  const phoneGroups = new Map<string, number>();
  const nameDobGroups = new Map<string, number>();
  for (const row of rows) {
    const email = cleanText(row.email).toLowerCase();
    if (email) emailGroups.set(email, (emailGroups.get(email) ?? 0) + 1);
    const phone = cleanText(row.phone_whatsapp).toLowerCase();
    if (phone) phoneGroups.set(phone, (phoneGroups.get(phone) ?? 0) + 1);
    const key = duplicateNameDobKey(row);
    if (key.replace(/\|/g, "").trim()) nameDobGroups.set(key, (nameDobGroups.get(key) ?? 0) + 1);
  }

  const duplicateEmailRecords = [...emailGroups.values()].filter((c) => c > 1).reduce((s, c) => s + c, 0);
  const duplicatePhoneRecords = [...phoneGroups.values()].filter((c) => c > 1).reduce((s, c) => s + c, 0);
  const duplicateNameDobRecords = [...nameDobGroups.values()].filter((c) => c > 1).reduce((s, c) => s + c, 0);

  const constituencyCoverage = countRows(rows.filter((row) => cleanText(row.constituency)), "constituency").slice(0, 12);

  return {
    slug: "external-data-import",
    eyebrow: "Data matching",
    title: "External data import & matching",
    description:
      "Live panel coverage and match-field readiness computed from the register — use this before importing voter rolls, census files, or client lists.",
    metrics: [
      { label: "Panel records", value: rows.length },
      { label: "Matchable emails", value: withEmail, hint: `${pct(withEmail, rows.length)}% coverage` },
      { label: "Matchable phones", value: withPhone, hint: `${pct(withPhone, rows.length)}% coverage` },
      { label: "With constituency", value: withConstituency, hint: `${withDob} with DOB for name+DOB match` },
    ],
    charts: [
      { id: "constituency", type: "bar", title: "Constituency coverage (panel register)", rows: constituencyCoverage },
    ],
    tables: [
      {
        id: "match-rules",
        title: "Internal match rule preview (panel vs panel)",
        columns: [
          { key: "rule", label: "Match rule" },
          { key: "clusters", label: "Duplicate clusters", align: "right" },
          { key: "records", label: "Records involved", align: "right" },
        ],
        rows: [
          { rule: "Email exact match", clusters: [...emailGroups.values()].filter((c) => c > 1).length, records: duplicateEmailRecords },
          { rule: "Phone / WhatsApp match", clusters: [...phoneGroups.values()].filter((c) => c > 1).length, records: duplicatePhoneRecords },
          { rule: "Name + date of birth", clusters: [...nameDobGroups.values()].filter((c) => c > 1).length, records: duplicateNameDobRecords },
        ],
        note: "Upload an external CSV on this page to match against the live panel register.",
      },
      {
        id: "gaps",
        title: "Geography gaps (districts with fewer than 5 panelists)",
        columns: [
          { key: "district", label: "District" },
          { key: "count", label: "Panelists", align: "right" },
        ],
        rows: countRows(rows, "district")
          .filter((row) => row.count < 5)
          .map((row) => ({ district: row.label, count: row.count })),
      },
    ],
    links: [{ label: "Open panelists register", href: "/admin/panelists" }],
  };
}

function buildClientProjects(hub: AdminDataHub): AdminModuleSnapshot {
  const projects = surveyProjects(hub);
  const active = projects.filter((project) => project.completed < project.assigned).length;

  return {
    slug: "client-project-management",
    eyebrow: "Research operations",
    title: "Client & project management",
    description:
      "Live project snapshots derived from survey assignments in the panel — each study maps to assigned, in-progress, and completed interviews.",
    metrics: [
      { label: "Active studies", value: active },
      { label: "Total studies", value: projects.length },
      { label: "Total assignments", value: hub.surveyRecords.length },
      {
        label: "Completed interviews",
        value: hub.surveyRecords.filter((record) => record.status === "completed").length,
      },
    ],
    charts: [
      {
        id: "category",
        type: "donut",
        title: "Studies by category",
        rows: countRows(
          projects.map((project) => ({ category: project.category } as PanelistRow)),
          "category"
        ),
      },
    ],
    tables: [
      {
        id: "projects",
        title: "Study project board",
        columns: [
          { key: "title", label: "Study" },
          { key: "category", label: "Category" },
          { key: "assigned", label: "Assigned", align: "right" },
          { key: "completed", label: "Completed", align: "right" },
          { key: "rate", label: "Completion %", align: "right" },
          { key: "districts", label: "Districts" },
          { key: "status", label: "Status" },
        ],
        rows: projects.map((project) => ({
          title: project.title,
          category: project.category,
          assigned: project.assigned,
          completed: project.completed,
          rate: `${pct(project.completed, project.assigned)}%`,
          districts: project.districts.size,
          status:
            project.completed === project.assigned
              ? "Completed"
              : project.overdue > 0
                ? "Fieldwork (overdue)"
                : project.inProgress > 0
                  ? "Fieldwork"
                  : "Approved",
        })),
      },
    ],
    links: [
      { label: "Survey distribution", href: "/admin/survey-distribution" },
      { label: "Sample selection", href: "/admin/sample-selection" },
    ],
  };
}

function buildFinancial(hub: AdminDataHub): AdminModuleSnapshot {
  const liability = incentiveLiability(hub);
  const totalBzPaid = liability.fulfilledBz;
  const totalBzPending = liability.pendingBz;
  const pointsOutstanding = liability.totalEarned - liability.fulfilledPoints - liability.pendingPoints;

  return {
    slug: "financial-revenue",
    eyebrow: "Finance",
    title: "Financial & revenue",
    description:
      "Incentive liability and redemption costs computed from live panel points and payout requests — proposal revenue is manual until client billing is integrated.",
    metrics: [
      { label: "Points issued (est.)", value: liability.totalEarned.toLocaleString() },
      { label: "Fulfilled payouts (BZ$)", value: totalBzPaid.toFixed(2) },
      { label: "Pending payouts (BZ$)", value: totalBzPending.toFixed(2) },
      {
        label: "Unredeemed liability (pts)",
        value: Math.max(0, pointsOutstanding).toLocaleString(),
        hint: `At ${redemptionRateLabel(DEFAULT_REWARD_SETTINGS)}`,
      },
    ],
    charts: [
      {
        id: "costs",
        type: "bar",
        title: "Point liability breakdown",
        rows: [
          { label: "Registration (25 ea)", count: liability.registrationPoints, percent: pct(liability.registrationPoints, liability.totalEarned) },
          { label: "Verification (50 ea)", count: liability.verificationPoints, percent: pct(liability.verificationPoints, liability.totalEarned) },
          { label: "Survey completions", count: liability.surveyPoints, percent: pct(liability.surveyPoints, liability.totalEarned) },
        ],
      },
    ],
    tables: [
      {
        id: "redemptions",
        title: "Redemption ledger",
        columns: [
          { key: "email", label: "Panelist" },
          { key: "option", label: "Option" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "points", label: "Points", align: "right" },
          { key: "status", label: "Status" },
          { key: "submitted", label: "Submitted" },
        ],
        rows: hub.redemptionRequests.map((request) => ({
          email: request.email,
          option: request.optionLabel,
          amount: request.amountBz ? `BZ$${request.amountBz.toFixed(2)}` : "—",
          points: request.points,
          status: request.status,
          submitted: formatDateTime(request.submittedAt),
        })),
      },
    ],
  };
}

function buildClientReporting(hub: AdminDataHub): AdminModuleSnapshot {
  const projects = surveyProjects(hub);
  const panelists = panelistByEmailMap(hub.panelists);

  const reportRows = projects.map((project) => {
    const records = hub.surveyRecords.filter((record) => record.title === project.title);
    const verifiedAssigned = records.filter((record) => {
      const email = cleanText(record.panelistEmail).toLowerCase();
      return cleanText(panelists.get(email)?.verification_status) === "Verified";
    }).length;
    return {
      title: project.title,
      target: project.assigned,
      completed: project.completed,
      completionRate: `${pct(project.completed, project.assigned)}%`,
      verifiedShare: `${pct(verifiedAssigned, project.assigned)}%`,
      overdue: project.overdue,
      topDistrict: [...project.districts][0] ?? "—",
    };
  });

  return {
    slug: "client-reporting",
    eyebrow: "Client delivery",
    title: "Client reporting portal",
    description:
      "Live fieldwork snapshots per study — target vs completed interviews, completion rates, and geography pulled from assignment records.",
    metrics: [
      {
        label: "Overall completion rate",
        value: `${pct(
          hub.surveyRecords.filter((record) => record.status === "completed").length,
          hub.surveyRecords.length
        )}%`,
      },
      { label: "Studies tracked", value: projects.length },
      { label: "Overdue assignments", value: hub.surveyRecords.filter((record) => isSurveyOverdue(record)).length },
      { label: "Avg. points per complete", value: Math.round(
        hub.surveyRecords.filter((record) => record.status === "completed").reduce((s, r) => s + r.points, 0) /
          Math.max(1, hub.surveyRecords.filter((record) => record.status === "completed").length)
      ) },
    ],
    charts: [
      {
        id: "completion",
        type: "bar",
        title: "Completion rate by study",
        rows: projects.map((project) => ({
          label: project.title.length > 28 ? `${project.title.slice(0, 28)}…` : project.title,
          count: project.completed,
          percent: pct(project.completed, project.assigned),
        })),
      },
    ],
    tables: [
      {
        id: "snapshots",
        title: "Client snapshot table",
        columns: [
          { key: "title", label: "Study" },
          { key: "target", label: "Target", align: "right" },
          { key: "completed", label: "Completed", align: "right" },
          { key: "completionRate", label: "Completion %", align: "right" },
          { key: "verifiedShare", label: "Verified %", align: "right" },
          { key: "overdue", label: "Overdue", align: "right" },
          { key: "topDistrict", label: "Top district" },
        ],
        rows: reportRows,
      },
    ],
  };
}

function buildCommunications(hub: AdminDataHub): AdminModuleSnapshot {
  const entries = Object.entries(hub.notificationState);
  let unreadVerification = 0;
  let unreadSurveys = 0;
  let unreadRewards = 0;
  for (const [, state] of entries) {
    if (state.verification && !state.verification.read) unreadVerification += 1;
    if (state.surveys && !state.surveys.read) unreadSurveys += 1;
    if (state.rewards && !state.rewards.read) unreadRewards += 1;
  }

  const pendingEmailChanges = hub.accounts.filter((account) => cleanText(account.pending_email)).length;
  const pendingPhoneChanges = hub.accounts.filter((account) => cleanText(account.pending_phone_whatsapp)).length;
  const unverifiedAccounts = hub.accounts.filter((account) => account.email_verified !== "true").length;

  return {
    slug: "communication-notifications",
    eyebrow: "Outreach",
    title: "Communication & notifications",
    description:
      "Live notification read-state, account verification backlog, and admin approval queue counts from panel operations data.",
    metrics: [
      { label: "Panelists with unread", value: entries.length },
      { label: "Unread survey notices", value: unreadSurveys },
      { label: "Unread verification", value: unreadVerification },
      { label: "Pending contact changes", value: pendingEmailChanges + pendingPhoneChanges },
    ],
    charts: [
      {
        id: "unread",
        type: "donut",
        title: "Unread notification categories",
        rows: [
          { label: "Surveys", count: unreadSurveys, percent: pct(unreadSurveys, unreadSurveys + unreadVerification + unreadRewards || 1) },
          { label: "Verification", count: unreadVerification, percent: pct(unreadVerification, unreadSurveys + unreadVerification + unreadRewards || 1) },
          { label: "Rewards", count: unreadRewards, percent: pct(unreadRewards, unreadSurveys + unreadVerification + unreadRewards || 1) },
        ],
      },
    ],
    tables: [
      {
        id: "backlog",
        title: "Operational messaging backlog",
        columns: [
          { key: "channel", label: "Channel / trigger" },
          { key: "count", label: "Pending items", align: "right" },
          { key: "action", label: "Admin action" },
        ],
        rows: [
          { channel: "Email verification", count: unverifiedAccounts, action: "Accounts awaiting verify-email" },
          { channel: "Email change approval", count: pendingEmailChanges, action: "POST /api/admin/approve-email-change" },
          { channel: "Phone change approval", count: pendingPhoneChanges, action: "POST /api/admin/approve-phone-change" },
          { channel: "Survey reminders (overdue)", count: hub.surveyRecords.filter((record) => isSurveyOverdue(record)).length, action: "Distribution engine export" },
          { channel: "Redemption confirmations", count: hub.redemptionRequests.filter((request) => request.status === "pending").length, action: "Fulfill in redemption ledger" },
        ],
      },
      {
        id: "read-state",
        title: "Panelist notification read state",
        columns: [
          { key: "email", label: "Panelist" },
          { key: "surveys", label: "Surveys" },
          { key: "verification", label: "Verification" },
          { key: "rewards", label: "Rewards" },
          { key: "updated", label: "Last activity" },
        ],
        rows: entries.map(([email, state]) => ({
          email,
          surveys: state.surveys?.read ? "Read" : "Unread",
          verification: state.verification?.read ? "Read" : "Unread",
          rewards: state.rewards?.read ? "Read" : "Unread",
          updated: formatDateTime(
            [state.surveys?.updatedAt, state.verification?.updatedAt, state.rewards?.updatedAt]
              .filter(Boolean)
              .sort()
              .reverse()[0] ?? ""
          ),
        })),
      },
    ],
  };
}

function buildDataProtection(hub: AdminDataHub): AdminModuleSnapshot {
  const research = boolCount(hub.panelists, "consent_research");
  const contact = boolCount(hub.panelists, "consent_contact");
  const privacy = boolCount(hub.panelists, "consent_privacy");
  const statusRows = countRows(hub.panelists, "status");

  return {
    slug: "data-protection",
    eyebrow: "Compliance",
    title: "Data protection & compliance",
    description:
      "Consent capture rates, panelist status distribution, and contact-restriction counts computed from the live register and auth accounts.",
    metrics: [
      { label: "Research consent", value: research.yes, hint: `${pct(research.yes, hub.panelists.length)}% of panel` },
      { label: "Contact consent", value: contact.yes, hint: `${pct(contact.yes, hub.panelists.length)}% of panel` },
      { label: "Privacy accepted", value: privacy.yes, hint: `${pct(privacy.yes, hub.panelists.length)}% of panel` },
      {
        label: "Restricted status",
        value: hub.panelists.filter((row) => {
          const status = cleanText(row.status).toLowerCase();
          return status.includes("do not") || status === "withdrawn" || status === "duplicate";
        }).length,
      },
    ],
    charts: [{ id: "status", type: "donut", title: "Panelist status distribution", rows: statusRows.slice(0, 8) }],
    tables: [
      {
        id: "consent",
        title: "Consent field summary",
        columns: [
          { key: "field", label: "Consent field" },
          { key: "granted", label: "Granted", align: "right" },
          { key: "denied", label: "Missing / false", align: "right" },
          { key: "rate", label: "Grant rate", align: "right" },
        ],
        rows: [
          { field: "Research participation", granted: research.yes, denied: research.no, rate: `${pct(research.yes, hub.panelists.length)}%` },
          { field: "Contact permission", granted: contact.yes, denied: contact.no, rate: `${pct(contact.yes, hub.panelists.length)}%` },
          { field: "Privacy notice", granted: privacy.yes, denied: privacy.no, rate: `${pct(privacy.yes, hub.panelists.length)}%` },
        ],
      },
      {
        id: "accounts",
        title: "Auth accounts overview",
        columns: [
          { key: "metric", label: "Metric" },
          { key: "value", label: "Count", align: "right" },
        ],
        rows: [
          { metric: "Total auth accounts", value: hub.accounts.length },
          { metric: "Email verified", value: hub.accounts.filter((account) => account.email_verified === "true").length },
          { metric: "Registered as panelist", value: hub.accounts.filter((account) => account.panelist_registered === "true").length },
          { metric: "On hold", value: hub.accounts.filter((account) => account.account_status === "on_hold").length },
        ],
      },
    ],
    links: [
      { label: "Data use policy", href: "/data-use-policy" },
      { label: "Account deletion flow", href: "/account/delete" },
    ],
  };
}

function buildFieldwork(hub: AdminDataHub): AdminModuleSnapshot {
  const panelists = panelistByEmailMap(hub.panelists);
  const districtMap = new Map<string, { assigned: number; completed: number; overdue: number; refusals: number }>();

  for (const record of hub.surveyRecords) {
    const email = cleanText(record.panelistEmail).toLowerCase();
    const district = cleanText(panelists.get(email)?.district) || "Unknown";
    const entry = districtMap.get(district) ?? { assigned: 0, completed: 0, overdue: 0, refusals: 0 };
    entry.assigned += 1;
    if (record.status === "completed") entry.completed += 1;
    if (isSurveyOverdue(record)) entry.overdue += 1;
    if (record.status === "available" && record.progressPercent === 0) entry.refusals += 0;
    districtMap.set(district, entry);
  }

  const districtRows = [...districtMap.entries()]
    .map(([district, stats]) => ({
      district,
      assigned: stats.assigned,
      completed: stats.completed,
      overdue: stats.overdue,
      productivity: `${pct(stats.completed, stats.assigned)}%`,
    }))
    .sort((a, b) => b.assigned - a.assigned);

  return {
    slug: "fieldwork-management",
    eyebrow: "Field operations",
    title: "Fieldwork management",
    description:
      "District-level assignment workload, completion productivity, and overdue callbacks derived from live survey assignments.",
    metrics: [
      { label: "Districts in field", value: districtMap.size },
      { label: "Active assignments", value: hub.surveyRecords.filter((record) => record.status !== "completed").length },
      { label: "Completed today (est.)", value: hub.surveyRecords.filter((record) => record.status === "completed").length },
      { label: "Overdue / callback", value: hub.surveyRecords.filter((record) => isSurveyOverdue(record)).length },
    ],
    charts: [
      {
        id: "productivity",
        type: "bar",
        title: "Completed interviews by district",
        rows: districtRows.slice(0, 10).map((row) => ({
          label: row.district,
          count: row.completed,
          percent: pct(row.completed, row.assigned),
        })),
      },
    ],
    tables: [
      {
        id: "districts",
        title: "Interviewer territory board",
        columns: [
          { key: "district", label: "District / territory" },
          { key: "assigned", label: "Assigned", align: "right" },
          { key: "completed", label: "Completed", align: "right" },
          { key: "overdue", label: "Overdue", align: "right" },
          { key: "productivity", label: "Productivity", align: "right" },
        ],
        rows: districtRows,
      },
    ],
    links: [{ label: "Distribution engine", href: "/admin/distribution-engine" }],
  };
}

function buildUserRoles(hub: AdminDataHub): AdminModuleSnapshot {
  return {
    slug: "user-roles",
    eyebrow: "Access control",
    title: "User roles & permissions",
    description:
      "MVP role matrix with live platform access counts — staff RBAC is planned; admin console currently uses a shared password gate.",
    metrics: [
      { label: "Auth accounts", value: hub.accounts.length },
      { label: "Panelist accounts", value: hub.accounts.filter((account) => account.panelist_registered === "true").length },
      { label: "Admin session gate", value: hub.envFlags.ADMIN_PASSWORD ? "Configured" : "Dev default" },
      { label: "Admin API key", value: hub.envFlags.ADMIN_API_KEY ? "Set" : "Not set" },
    ],
    charts: [],
    tables: [
      {
        id: "roles",
        title: "Role capability matrix (MVP design)",
        columns: [
          { key: "role", label: "Role" },
          { key: "scope", label: "Access scope" },
          { key: "modules", label: "Key modules" },
          { key: "live", label: "Portal today" },
        ],
        rows: [
          { role: "Super Admin", scope: "Full platform", modules: "All admin modules", live: hub.envFlags.ADMIN_PASSWORD ? "Password gate" : "Dev mode" },
          { role: "Operations Manager", scope: "Panel & fieldwork", modules: "Dashboard, sampling, distribution", live: "Shared admin login" },
          { role: "Research Analyst", scope: "Analytics & reporting", modules: "Analytics, client reporting", live: "Shared admin login" },
          { role: "Field Supervisor", scope: "Fieldwork QC", modules: "Fieldwork, fraud", live: "Shared admin login" },
          { role: "Finance Officer", scope: "Billing & rewards", modules: "Financial, redemptions", live: "File-based ledger" },
          { role: "Client Viewer", scope: "Read-only reports", modules: "Client reporting", live: "Not deployed" },
          { role: "Panelist", scope: "Self-service", modules: "Dashboard, surveys, rewards", live: `${hub.accounts.filter((account) => account.panelist_registered === "true").length} accounts` },
        ],
      },
    ],
    links: [{ label: "Admin login", href: "/admin/login" }],
  };
}

function buildBackup(hub: AdminDataHub): AdminModuleSnapshot {
  const totalBytes = hub.dataFiles.reduce((sum, file) => sum + file.bytes, 0);
  const latest = hub.dataFiles
    .filter((file) => file.exists)
    .map((file) => file.modifiedAt)
    .sort()
    .reverse()[0];

  return {
    slug: "backup-recovery",
    eyebrow: "Resilience",
    title: "Backup & recovery",
    description:
      "Live inventory of critical data files with size, record counts, and last modified timestamps from the panel data store.",
    metrics: [
      { label: "Data files tracked", value: hub.dataFiles.filter((file) => file.exists).length },
      { label: "Total storage", value: formatBytes(totalBytes) },
      { label: "Panel records", value: hub.panelists.length },
      { label: "Last file update", value: latest ? formatDateTime(latest) : "—" },
    ],
    charts: [],
    tables: [
      {
        id: "files",
        title: "Critical data file inventory",
        columns: [
          { key: "label", label: "File" },
          { key: "path", label: "Path" },
          { key: "rows", label: "Records", align: "right" },
          { key: "size", label: "Size", align: "right" },
          { key: "modified", label: "Last modified" },
          { key: "status", label: "Status" },
        ],
        rows: hub.dataFiles.map((file) => ({
          label: file.label,
          path: file.path,
          rows: file.rowCount ?? "—",
          size: file.exists ? formatBytes(file.bytes) : "—",
          modified: file.exists ? formatDateTime(file.modifiedAt) : "—",
          status: file.exists ? "Present" : "Missing",
        })),
      },
    ],
    links: [{ label: "Open panelists register", href: "/admin/panelists" }],
  };
}

function buildSystemSettings(hub: AdminDataHub): AdminModuleSnapshot {
  return {
    slug: "system-settings",
    eyebrow: "Configuration",
    title: "System settings",
    description:
      "Operational defaults for panel rewards and redemption — edit live values under Admin → Reward settings.",
    links: [{ label: "Open reward settings", href: "/admin/reward-settings" }],
    metrics: [
      { label: "Redemption minimum", value: `${DEFAULT_REWARD_SETTINGS.redemptionMinimumPoints} pts` },
      { label: "Redemption rate", value: redemptionRateLabel(DEFAULT_REWARD_SETTINGS) },
      { label: "Registration reward", value: `${DEFAULT_REWARD_SETTINGS.registrationRewardPoints} pts` },
      { label: "Verification reward", value: `${DEFAULT_REWARD_SETTINGS.verificationRewardPoints} pts` },
    ],
    charts: [],
    tables: [
      {
        id: "defaults",
        title: "Platform defaults (live)",
        columns: [
          { key: "setting", label: "Setting" },
          { key: "value", label: "Current value" },
          { key: "source", label: "Source" },
        ],
        rows: [
          { setting: "Survey completion reward (default)", value: "100 points", source: "panelist-surveys.json assignments" },
          { setting: "Sample confidence default", value: "95%", source: "Sample selection engine" },
          { setting: "Sample response rate default", value: "35%", source: "Sample selection calculator" },
          { setting: "Duplicate detection", value: "Strict at registration", source: "register API" },
          { setting: "Admin entry on home page", value: hub.envFlags.NEXT_PUBLIC_SHOW_ADMIN_ENTRY ? "Visible" : "Hidden", source: "NEXT_PUBLIC_SHOW_ADMIN_ENTRY" },
          { setting: "Demo accounts", value: hub.envFlags.ENABLE_DEMO_ACCOUNTS ? "Enabled" : "Disabled", source: "ENABLE_DEMO_ACCOUNTS" },
        ],
      },
      {
        id: "env",
        title: "Environment security flags",
        columns: [
          { key: "variable", label: "Variable" },
          { key: "set", label: "Configured" },
        ],
        rows: Object.entries(hub.envFlags).map(([variable, set]) => ({
          variable,
          set: set ? "Yes" : "No",
        })),
      },
    ],
  };
}

function buildApiIntegrations(): AdminModuleSnapshot {
  const routes = [
    { group: "Auth", route: "POST /api/auth/login", status: "Live" },
    { group: "Auth", route: "POST /api/auth/signup", status: "Live" },
    { group: "Auth", route: "GET /api/auth/me", status: "Live" },
    { group: "Registration", route: "POST /api/register", status: "Live" },
    { group: "Registration", route: "GET /api/check-username", status: "Live" },
    { group: "Profile", route: "GET/PATCH /api/profile", status: "Live" },
    { group: "Profile", route: "POST /api/profile/request-email-change", status: "Live" },
    { group: "Profile", route: "POST /api/profile/request-phone-change", status: "Live" },
    { group: "Rewards", route: "POST /api/rewards/redeem", status: "Live" },
    { group: "Rewards", route: "GET/PATCH /api/rewards/points", status: "Live" },
    { group: "Notifications", route: "GET/PATCH /api/notifications", status: "Live" },
    { group: "Admin", route: "POST /api/admin/login", status: "Live" },
    { group: "Admin", route: "POST /api/admin/panelists/mark-duplicates", status: "Live" },
    { group: "Admin", route: "GET /api/admin/panelists/export", status: "Live" },
    { group: "Admin", route: "PATCH /api/admin/panelists/[email]", status: "Live" },
    { group: "Admin", route: "POST /api/admin/approve-email-change", status: "Live" },
    { group: "Admin", route: "POST /api/admin/approve-phone-change", status: "Live" },
    { group: "Account", route: "POST /api/account/delete", status: "Live" },
    { group: "Survey platforms", route: "QuestionPro / Qualtrics webhooks", status: "Planned" },
    { group: "Messaging", route: "WhatsApp Business API", status: "Planned" },
    { group: "Messaging", route: "SMS gateway", status: "Planned" },
  ];
  const live = routes.filter((route) => route.status === "Live").length;

  return {
    slug: "api-integrations",
    eyebrow: "Integrations",
    title: "API & integrations",
    description: "Internal REST API route registry with live vs planned external connectors from the MVP integration catalog.",
    metrics: [
      { label: "Live API routes", value: live },
      { label: "Planned connectors", value: routes.length - live },
      { label: "Auth endpoints", value: routes.filter((route) => route.group === "Auth").length },
      { label: "Admin endpoints", value: routes.filter((route) => route.group === "Admin").length },
    ],
    charts: [
      {
        id: "status",
        type: "donut",
        title: "Integration status",
        rows: [
          { label: "Live", count: live, percent: pct(live, routes.length) },
          { label: "Planned", count: routes.length - live, percent: pct(routes.length - live, routes.length) },
        ],
      },
    ],
    tables: [
      {
        id: "routes",
        title: "API route registry",
        columns: [
          { key: "group", label: "Group" },
          { key: "route", label: "Route / integration" },
          { key: "status", label: "Status" },
        ],
        rows: routes,
      },
    ],
  };
}

function buildDeployment(hub: AdminDataHub): AdminModuleSnapshot {
  const checklist = [
    { item: "HTTPS / SSL (Netlify)", done: true },
    { item: "Admin authentication configured", done: hub.envFlags.ADMIN_PASSWORD },
    { item: "AUTH_SESSION_SECRET set", done: hub.envFlags.AUTH_SESSION_SECRET },
    { item: "Panel data files present", done: hub.dataFiles.every((file) => file.exists) },
    { item: "Demo accounts disabled for production", done: !hub.envFlags.ENABLE_DEMO_ACCOUNTS },
    { item: "PostgreSQL migration", done: false },
    { item: "Automated cloud backups", done: false },
    { item: "Error monitoring (Sentry)", done: false },
  ];
  const done = checklist.filter((row) => row.done).length;

  return {
    slug: "deployment-production",
    eyebrow: "Launch readiness",
    title: "Deployment & production",
    description:
      "Hosting configuration, environment checklist, and data-store readiness computed from deployment files and live env flags.",
    metrics: [
      { label: "Checklist complete", value: `${done}/${checklist.length}` },
      { label: "Launch stage", value: hub.envFlags.ENABLE_DEMO_ACCOUNTS ? "Pilot" : "Pre-production" },
      { label: "Data store", value: "CSV / JSON (file-based)" },
      { label: "Build target", value: "Netlify + Next.js 16" },
    ],
    charts: [],
    tables: [
      {
        id: "checklist",
        title: "Production readiness checklist",
        columns: [
          { key: "item", label: "Item" },
          { key: "status", label: "Status" },
        ],
        rows: checklist.map((row) => ({
          item: row.item,
          status: row.done ? "Complete" : "Pending",
        })),
      },
      {
        id: "hosting",
        title: "Hosting configuration",
        columns: [
          { key: "key", label: "Setting" },
          { key: "value", label: "Value" },
        ],
        rows: [
          { key: "Platform", value: "Netlify" },
          { key: "Base directory", value: "web/" },
          { key: "Publish directory", value: ".next" },
          { key: "Node version", value: "20" },
          { key: "Panel register records", value: hub.panelists.length },
        ],
      },
    ],
  };
}

function buildDistributionEngine(hub: AdminDataHub): AdminModuleSnapshot {
  const panelists = panelistByEmailMap(hub.panelists);
  const active = hub.surveyRecords.filter((record) => record.status !== "completed");

  return {
    slug: "distribution-engine",
    eyebrow: "Outreach batches",
    title: "Distribution engine",
    description:
      "Prepare contact export batches from live survey assignments — download CSV for WhatsApp, email, or SMS outreach.",
    metrics: [
      { label: "Active assignments", value: active.length },
      { label: "Unique studies", value: new Set(active.map((record) => record.id)).size },
      { label: "Contactable (phone)", value: active.filter((record) => cleanText(panelists.get(cleanText(record.panelistEmail).toLowerCase())?.phone_whatsapp)).length },
      { label: "Overdue invites", value: active.filter((record) => isSurveyOverdue(record)).length },
    ],
    charts: [
      {
        id: "mode",
        type: "bar",
        title: "Assignments by category (outreach pool)",
        rows: countRows(
          active.map((record) => ({ category: record.category } as PanelistRow)),
          "category"
        ),
      },
    ],
    tables: [
      {
        id: "batches",
        title: "Outreach batch preview (first 50)",
        columns: [
          { key: "survey", label: "Survey" },
          { key: "panelist", label: "Panelist" },
          { key: "phone", label: "Phone" },
          { key: "district", label: "District" },
          { key: "status", label: "Status" },
          { key: "due", label: "Due" },
        ],
        rows: active.slice(0, 50).map((record) => {
          const email = cleanText(record.panelistEmail).toLowerCase();
          const panelist = panelists.get(email);
          return {
            survey: record.title,
            panelist: `${cleanText(panelist?.first_name)} ${cleanText(panelist?.last_name)}`.trim() || email,
            phone: cleanText(panelist?.phone_whatsapp) || "—",
            district: cleanText(panelist?.district) || "—",
            status: isSurveyOverdue(record) ? "overdue" : record.status,
            due: record.completeByDate,
          };
        }),
        note: "Use Export CSV below for the full distribution contact file.",
      },
    ],
    links: [{ label: "Survey distribution", href: "/admin/survey-distribution" }],
  };
}

export function buildDistributionExportRows(hub: AdminDataHub, mode = "Email"): DistributionExportRow[] {
  const panelists = panelistByEmailMap(hub.panelists);
  return hub.surveyRecords
    .filter((record) => record.status !== "completed")
    .map((record, index) => {
      const email = cleanText(record.panelistEmail).toLowerCase();
      const panelist = panelists.get(email);
      return {
        distributionId: `dist-${record.id}-${index + 1}`,
        surveyTitle: record.title,
        firstName: cleanText(panelist?.first_name),
        lastName: cleanText(panelist?.last_name),
        phone: cleanText(panelist?.phone_whatsapp),
        email,
        facebook: cleanText(panelist?.facebook),
        instagram: cleanText(panelist?.instagram),
        tiktok: cleanText(panelist?.tiktok),
        district: cleanText(panelist?.district),
        constituency: cleanText(panelist?.constituency),
        surveyUrl: cleanText(record.surveyUrl ?? ""),
        mode,
      };
    });
}

export function buildPanelMatchIndex(hub: AdminDataHub): PanelMatchIndex {
  return {
    emails: hub.panelists.map((row) => cleanText(row.email).toLowerCase()).filter(Boolean),
    phones: hub.panelists.map((row) => cleanText(row.phone_whatsapp).toLowerCase()).filter(Boolean),
    nameDobKeys: hub.panelists.map((row) => duplicateNameDobKey(row)).filter((key) => key.replace(/\|/g, "").trim()),
  };
}

const BUILDERS: Record<DataModuleSlug, (hub: AdminDataHub) => AdminModuleSnapshot> = {
  "external-data-import": buildExternalDataImport,
  "client-project-management": buildClientProjects,
  "financial-revenue": buildFinancial,
  "client-reporting": buildClientReporting,
  "communication-notifications": buildCommunications,
  "data-protection": buildDataProtection,
  "fieldwork-management": buildFieldwork,
  "user-roles": buildUserRoles,
  "backup-recovery": buildBackup,
  "system-settings": buildSystemSettings,
  "api-integrations": () => buildApiIntegrations(),
  "deployment-production": buildDeployment,
  "distribution-engine": buildDistributionEngine,
};

export function buildModuleSnapshot(slug: string, hub: AdminDataHub): AdminModuleSnapshot | null {
  const builder = BUILDERS[slug as DataModuleSlug];
  if (!builder) return null;
  return builder(hub);
}

export function isDataModuleSlug(slug: string): slug is DataModuleSlug {
  return (DATA_MODULE_SLUGS as readonly string[]).includes(slug);
}
