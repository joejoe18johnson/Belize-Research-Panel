import type { PanelistSurveyRecord, SurveyCategory, SurveyStatus } from "./panelist-surveys-types";
import { isSurveyOverdue } from "./panelist-surveys-types";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

export interface SurveyAssignmentRow {
  recordId: string;
  surveyId: string;
  title: string;
  category: SurveyCategory;
  panelistEmail: string;
  panelistName: string;
  district: string;
  constituency: string;
  verificationStatus: string;
  status: SurveyStatus;
  points: number;
  assignedDate: string;
  completeByDate: string;
  progressPercent: number;
  overdue: boolean;
  surveyUrl: string;
}

export interface SurveyDistributionStats {
  totalAssignments: number;
  uniqueSurveys: number;
  uniquePanelists: number;
  active: number;
  inProgress: number;
  completed: number;
  overdue: number;
  byCategory: { label: string; count: number }[];
  byStatus: { label: string; count: number }[];
}

export type TargetGroup =
  | "all_verified"
  | "registered_voters"
  | "specific_constituency"
  | "market_target"
  | "custom";

export const DELIVERY_METHODS = [
  "Email",
  "WhatsApp",
  "SMS",
  "Facebook Messenger",
  "External Survey Link",
] as const;

export const TARGET_GROUPS: { id: TargetGroup; label: string }[] = [
  { id: "all_verified", label: "All verified panelists" },
  { id: "registered_voters", label: "Registered voters only" },
  { id: "specific_constituency", label: "Specific constituency" },
  { id: "market_target", label: "Market research target" },
  { id: "custom", label: "Custom filtered sample" },
];

export const REWARD_OPTIONS = ["100 points", "150 points", "200 points", "Custom reward", "No reward"] as const;

function panelistName(row: PanelistRow | undefined): string {
  if (!row) return "Unknown";
  return `${cleanText(row.first_name)} ${cleanText(row.last_name)}`.trim() || "Unknown";
}

export function buildSurveyAssignmentRows(
  records: PanelistSurveyRecord[],
  panelistsByEmail: Map<string, PanelistRow>
): SurveyAssignmentRow[] {
  return records
    .filter((record) => cleanText(record.panelistEmail))
    .map((record) => {
      const email = cleanText(record.panelistEmail).toLowerCase();
      const panelist = panelistsByEmail.get(email);
      const status = record.status;
      return {
        recordId: `${record.id}:${email}`,
        surveyId: record.id,
        title: record.title,
        category: record.category,
        panelistEmail: email,
        panelistName: panelistName(panelist),
        district: cleanText(panelist?.district),
        constituency: cleanText(panelist?.constituency),
        verificationStatus: cleanText(panelist?.verification_status) || "Unknown",
        status,
        points: record.points,
        assignedDate: record.assignedDate,
        completeByDate: record.completeByDate,
        progressPercent: record.progressPercent,
        overdue: isSurveyOverdue(record),
        surveyUrl: cleanText(record.surveyUrl ?? ""),
      };
    });
}

export function buildSurveyDistributionStats(rows: SurveyAssignmentRow[]): SurveyDistributionStats {
  const categoryMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const surveyIds = new Set<string>();
  const emails = new Set<string>();

  let active = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;

  for (const row of rows) {
    surveyIds.add(row.surveyId);
    emails.add(row.panelistEmail);
    categoryMap.set(row.category, (categoryMap.get(row.category) ?? 0) + 1);
    statusMap.set(row.status, (statusMap.get(row.status) ?? 0) + 1);
    if (row.status === "available") active += 1;
    if (row.status === "in_progress") inProgress += 1;
    if (row.status === "completed") completed += 1;
    if (row.overdue) overdue += 1;
  }

  return {
    totalAssignments: rows.length,
    uniqueSurveys: surveyIds.size,
    uniquePanelists: emails.size,
    active,
    inProgress,
    completed,
    overdue,
    byCategory: [...categoryMap.entries()].map(([label, count]) => ({ label, count })),
    byStatus: [...statusMap.entries()].map(([label, count]) => ({ label, count })),
  };
}

export function filterSurveyAssignments(
  rows: SurveyAssignmentRow[],
  filters: {
    search: string;
    categories: string[];
    statuses: string[];
    verificationStatuses: string[];
    districts: string[];
    overdueOnly: boolean;
  }
): SurveyAssignmentRow[] {
  const search = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (search) {
      const haystack = `${row.title} ${row.panelistName} ${row.panelistEmail} ${row.district}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.categories.length && !filters.categories.includes(row.category)) return false;
    if (filters.statuses.length && !filters.statuses.includes(row.status)) return false;
    if (filters.verificationStatuses.length && !filters.verificationStatuses.includes(row.verificationStatus)) {
      return false;
    }
    if (filters.districts.length && !filters.districts.includes(row.district)) return false;
    if (filters.overdueOnly && !row.overdue) return false;
    return true;
  });
}

export function countEligibleForTarget(
  panelists: PanelistRow[],
  target: TargetGroup,
  constituency = ""
): number {
  return filterPanelistsForTarget(panelists, target, constituency).length;
}

export function filterPanelistsForTarget(
  panelists: PanelistRow[],
  target: TargetGroup,
  constituency = ""
): PanelistRow[] {
  let pool = panelists.filter((row) => cleanText(row.verification_status) === "Verified");
  pool = pool.filter((row) => cleanText(row.status) === "Active");

  if (target === "registered_voters") {
    pool = pool.filter((row) => {
      const vs = cleanText(row.voter_status).toLowerCase();
      const voting = cleanText(row.voting_status).toLowerCase();
      return vs === "registered voter" || voting === "yes";
    });
  }
  if (target === "specific_constituency" && constituency) {
    pool = pool.filter((row) => cleanText(row.constituency) === constituency);
  }
  if (target === "market_target") {
    pool = pool.filter((row) => cleanText(row.market_interests));
  }
  return pool;
}

export function sortSurveyAssignments(
  rows: SurveyAssignmentRow[],
  key: keyof SurveyAssignmentRow,
  direction: "asc" | "desc"
): SurveyAssignmentRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return factor * (av - bv);
    return factor * String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
  });
}
