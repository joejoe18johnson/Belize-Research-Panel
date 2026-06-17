import type { CampaignRecord } from "./campaign-targeting";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

export interface CampaignAssignmentLink {
  panelistEmail: string;
  panelistName: string;
  surveyLink: string;
}

function panelistDisplayName(row: PanelistRow): string {
  const name = `${cleanText(row.first_name)} ${cleanText(row.last_name)}`.trim();
  return name || cleanText(row.email) || "Panelist";
}

export function buildCampaignSurveyUrl(
  origin: string,
  campaign: Pick<CampaignRecord, "id" | "deliveryType" | "surveyUrl">
): string {
  const base = origin.replace(/\/$/, "");
  if (campaign.deliveryType === "internal") {
    return `${base}/dashboard/surveys/${encodeURIComponent(campaign.id)}`;
  }
  return cleanText(campaign.surveyUrl);
}

export function buildCampaignAssignmentLinks(
  origin: string,
  campaign: CampaignRecord,
  assignedPanelists: PanelistRow[]
): CampaignAssignmentLink[] {
  const surveyLink = buildCampaignSurveyUrl(origin, campaign);

  return assignedPanelists.map((panelist) => ({
    panelistEmail: cleanText(panelist.email),
    panelistName: panelistDisplayName(panelist),
    surveyLink,
  }));
}
