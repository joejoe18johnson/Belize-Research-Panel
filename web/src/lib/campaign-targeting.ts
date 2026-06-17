import type { TargetGroup } from "./admin-survey-distribution";
import { filterPanelistsForTarget } from "./admin-survey-distribution";
import type { PanelistSurveyRecord, SurveyCategory } from "./panelist-surveys-types";
import { isSurveyOverdue } from "./panelist-surveys-types";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

export type CampaignStatus = "draft" | "active" | "closed";

export type CampaignTargetMode =
  | TargetGroup
  | "specific_districts"
  | "specific_constituencies"
  | "specific_emails";

export interface CampaignTargeting {
  mode: CampaignTargetMode;
  constituency?: string;
  districts?: string[];
  constituencies?: string[];
  emails?: string[];
}

export interface CampaignRecord {
  id: string;
  title: string;
  description: string;
  category: SurveyCategory;
  status: CampaignStatus;
  surveyUrl: string;
  surveyDefinitionId?: string;
  deliveryType: "internal" | "external";
  points: number;
  assignedDate: string;
  completeByDate: string;
  deliveryMethod: string;
  targeting: CampaignTargeting;
  createdAt: string;
  launchedAt: string;
}

export interface CampaignSummary {
  id: string;
  title: string;
  description: string;
  category: SurveyCategory;
  status: CampaignStatus;
  surveyUrl: string;
  points: number;
  assignedDate: string;
  completeByDate: string;
  deliveryMethod: string;
  targetingLabel: string;
  launchedAt: string;
  assigned: number;
  pending: number;
  opened: number;
  completed: number;
  overdue: number;
  responseRate: number;
  stored: boolean;
}

export interface CampaignAssignmentDetail {
  panelistEmail: string;
  panelistName: string;
  district: string;
  constituency: string;
  status: PanelistSurveyRecord["status"];
  progressPercent: number;
  overdue: boolean;
  assignedDate: string;
  completeByDate: string;
}

export interface CreateCampaignInput {
  title: string;
  description?: string;
  category: SurveyCategory;
  surveyUrl?: string;
  surveyDefinitionId?: string;
  deliveryType: "internal" | "external";
  points: number;
  assignedDate: string;
  completeByDate: string;
  deliveryMethod: string;
  targeting: CampaignTargeting;
}

export const CAMPAIGN_TARGET_OPTIONS: { id: CampaignTargetMode; label: string }[] = [
  { id: "all_verified", label: "All verified panelists" },
  { id: "registered_voters", label: "Registered voters only" },
  { id: "specific_constituency", label: "Single constituency" },
  { id: "specific_districts", label: "Specific districts" },
  { id: "specific_constituencies", label: "Specific constituencies" },
  { id: "specific_emails", label: "Specific panelists (by email)" },
  { id: "market_target", label: "Market research interests" },
  { id: "custom", label: "All verified (custom sample)" },
];

export function targetingLabel(targeting: CampaignTargeting): string {
  switch (targeting.mode) {
    case "all_verified":
      return "All verified panelists";
    case "registered_voters":
      return "Registered voters";
    case "specific_constituency":
      return targeting.constituency ? `Constituency: ${targeting.constituency}` : "Single constituency";
    case "specific_districts":
      return targeting.districts?.length
        ? `Districts: ${targeting.districts.join(", ")}`
        : "Specific districts";
    case "specific_constituencies":
      return targeting.constituencies?.length
        ? `Constituencies: ${targeting.constituencies.join(", ")}`
        : "Specific constituencies";
    case "specific_emails":
      return `${targeting.emails?.length ?? 0} specific panelist(s)`;
    case "market_target":
      return "Market research target";
    default:
      return "Custom verified sample";
  }
}

export function resolveCampaignAudience(panelists: PanelistRow[], targeting: CampaignTargeting): PanelistRow[] {
  if (targeting.mode === "specific_emails") {
    const emails = new Set((targeting.emails ?? []).map((email) => cleanText(email).toLowerCase()).filter(Boolean));
    return panelists.filter((row) => emails.has(cleanText(row.email).toLowerCase()));
  }

  if (targeting.mode === "specific_districts") {
    const districts = new Set((targeting.districts ?? []).map((value) => cleanText(value)).filter(Boolean));
    return panelists.filter(
      (row) =>
        cleanText(row.verification_status) === "Verified" &&
        cleanText(row.status) === "Active" &&
        districts.has(cleanText(row.district))
    );
  }

  if (targeting.mode === "specific_constituencies") {
    const constituencies = new Set((targeting.constituencies ?? []).map((value) => cleanText(value)).filter(Boolean));
    return panelists.filter(
      (row) =>
        cleanText(row.verification_status) === "Verified" &&
        cleanText(row.status) === "Active" &&
        constituencies.has(cleanText(row.constituency))
    );
  }

  return filterPanelistsForTarget(panelists, targeting.mode as TargetGroup, targeting.constituency ?? "");
}

export function countCampaignAudience(panelists: PanelistRow[], targeting: CampaignTargeting): number {
  return resolveCampaignAudience(panelists, targeting).length;
}

function panelistName(row: PanelistRow | undefined): string {
  if (!row) return "Unknown";
  return `${cleanText(row.first_name)} ${cleanText(row.last_name)}`.trim() || "Unknown";
}

function inferCampaignFromAssignments(id: string, records: PanelistSurveyRecord[]): CampaignRecord | null {
  const sample = records.find((record) => record.id === id);
  if (!sample) return null;

  return {
    id,
    title: sample.title,
    description: "",
    category: sample.category,
    status: "active",
    surveyUrl: cleanText(sample.surveyUrl ?? ""),
    points: sample.points,
    assignedDate: sample.assignedDate,
    completeByDate: sample.completeByDate,
    deliveryMethod: "External Survey Link",
    targeting: { mode: "all_verified" },
    createdAt: sample.assignedDate || new Date().toISOString().slice(0, 10),
    launchedAt: sample.assignedDate || new Date().toISOString().slice(0, 10),
  };
}

export function buildCampaignSummaries(
  campaigns: CampaignRecord[],
  assignments: PanelistSurveyRecord[]
): CampaignSummary[] {
  const storedById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const assignmentIds = new Set(assignments.map((record) => record.id));

  for (const id of assignmentIds) {
    if (!storedById.has(id)) {
      const inferred = inferCampaignFromAssignments(id, assignments);
      if (inferred) storedById.set(id, inferred);
    }
  }

  return [...storedById.values()]
    .map((campaign) => {
      const rows = assignments.filter((record) => record.id === campaign.id);
      let pending = 0;
      let opened = 0;
      let completed = 0;
      let overdue = 0;

      for (const record of rows) {
        if (record.status === "available") pending += 1;
        if (record.status === "in_progress") opened += 1;
        if (record.status === "completed") completed += 1;
        if (isSurveyOverdue(record)) overdue += 1;
      }

      const assigned = rows.length;
      const responseRate = assigned ? Math.round((completed / assigned) * 1000) / 10 : 0;

      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        status: campaign.status,
        surveyUrl: campaign.surveyUrl,
        points: campaign.points,
        assignedDate: campaign.assignedDate,
        completeByDate: campaign.completeByDate,
        deliveryMethod: campaign.deliveryMethod,
        targetingLabel: targetingLabel(campaign.targeting),
        launchedAt: campaign.launchedAt,
        assigned,
        pending,
        opened,
        completed,
        overdue,
        responseRate,
        stored: campaigns.some((item) => item.id === campaign.id),
      };
    })
    .sort((a, b) => b.launchedAt.localeCompare(a.launchedAt) || b.assigned - a.assigned);
}

export function buildCampaignAssignmentDetails(
  campaignId: string,
  assignments: PanelistSurveyRecord[],
  panelistsByEmail: Map<string, PanelistRow>
): CampaignAssignmentDetail[] {
  return assignments
    .filter((record) => record.id === campaignId && cleanText(record.panelistEmail))
    .map((record) => {
      const email = cleanText(record.panelistEmail).toLowerCase();
      const panelist = panelistsByEmail.get(email);
      return {
        panelistEmail: email,
        panelistName: panelistName(panelist),
        district: cleanText(panelist?.district),
        constituency: cleanText(panelist?.constituency),
        status: record.status,
        progressPercent: record.progressPercent,
        overdue: isSurveyOverdue(record),
        assignedDate: record.assignedDate,
        completeByDate: record.completeByDate,
      };
    })
    .sort((a, b) => a.panelistName.localeCompare(b.panelistName));
}
