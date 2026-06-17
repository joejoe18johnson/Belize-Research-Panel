import type { PanelistSurvey, PanelistSurveyRecord } from "./panelist-surveys-types";
import { formatSurveyDate } from "./panelist-surveys-types";
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

async function loadSurveyRecords(): Promise<PanelistSurveyRecord[]> {
  const { loadSurveyRecordsFromFile } = await import("./panelist-surveys-store");
  return loadSurveyRecordsFromFile();
}

export async function getPanelistSurveys(email: string): Promise<{
  inbox: PanelistSurvey[];
  completed: PanelistSurvey[];
}> {
  const normalizedEmail = cleanText(email).toLowerCase();
  const records = await loadSurveyRecords();

  const matched = records.filter((record) => {
    const assignedEmail = cleanText(record.panelistEmail ?? "").toLowerCase();
    return !assignedEmail || assignedEmail === normalizedEmail;
  });

  const surveys = matched.map(toPanelistSurvey);

  return {
    inbox: surveys.filter((survey) => survey.status !== "completed"),
    completed: surveys.filter((survey) => survey.status === "completed"),
  };
}
