import { promises as fs } from "fs";
import path from "path";
import type { PanelistSurvey, PanelistSurveyRecord } from "./panelist-surveys-types";
import { formatSurveyDate } from "./panelist-surveys-types";
import { cleanText } from "./validation";

export type { PanelistSurvey, PanelistSurveyRecord, SurveyCategory, SurveyStatus } from "./panelist-surveys-types";
export { formatSurveyDate, isSurveyOverdue } from "./panelist-surveys-types";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-surveys.json");

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
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as PanelistSurveyRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
