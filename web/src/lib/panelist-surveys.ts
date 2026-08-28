import type { PanelistSurvey, PanelistSurveyRecord } from "./panelist-surveys-types";
import { formatSurveyDate } from "./panelist-surveys-types";
import { loadCampaignRecords } from "./campaigns";
import { cleanText } from "./validation";

export type { PanelistSurvey, PanelistSurveyRecord, SurveyCategory, SurveyStatus } from "./panelist-surveys-types";
export { formatSurveyDate, isSurveyOverdue } from "./panelist-surveys-types";

function toPanelistSurvey(record: PanelistSurveyRecord): PanelistSurvey {
  return {
    ...record,
    progressPercent: Math.min(100, Math.max(0, record.progressPercent)),
    assignedDateLabel: formatSurveyDate(record.assignedDate),
    completeByDateLabel: formatSurveyDate(record.completeByDate),
    completedDateLabel: record.completedDate ? formatSurveyDate(record.completedDate) : null,
  };
}

export async function getPanelistSurveys(email: string): Promise<{
  inbox: PanelistSurvey[];
  completed: PanelistSurvey[];
}> {
  const normalizedEmail = cleanText(email).toLowerCase();
  const { loadSurveyRecordsForEmail } = await import("./panelist-surveys-store");
  const [records, campaigns] = await Promise.all([
    loadSurveyRecordsForEmail(normalizedEmail),
    loadCampaignRecords(),
  ]);
  const coversByCampaignId = new Map(
    campaigns.map((campaign) => [campaign.id, campaign.coverImageFile ?? ""] as const)
  );
  const logosByCampaignId = new Map(
    campaigns.map((campaign) => [campaign.id, campaign.logoFile ?? ""] as const)
  );

  const surveys = records.map((record) =>
    toPanelistSurvey({
      ...record,
      coverImageFile: coversByCampaignId.get(record.id) || record.coverImageFile || "",
      logoFile: logosByCampaignId.get(record.id) || record.logoFile || "",
    })
  );

  const byAssignedNewest = (a: PanelistSurvey, b: PanelistSurvey) =>
    b.assignedDate.localeCompare(a.assignedDate) || b.id.localeCompare(a.id);

  return {
    inbox: surveys.filter((survey) => survey.status !== "completed").sort(byAssignedNewest),
    completed: surveys.filter((survey) => survey.status === "completed").sort(byAssignedNewest),
  };
}
