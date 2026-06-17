export type SurveyCategory = "political" | "market" | "civic";
export type SurveyStatus = "available" | "in_progress" | "completed";

export interface PanelistSurveyRecord {
  id: string;
  title: string;
  category: SurveyCategory;
  assignedDate: string;
  completeByDate: string;
  points: number;
  status: SurveyStatus;
  progressPercent: number;
  completedDate: string | null;
  surveyUrl?: string | null;
  surveyDefinitionId?: string | null;
  deliveryType?: "internal" | "external";
  panelistEmail?: string;
}

export interface PanelistSurvey extends PanelistSurveyRecord {
  assignedDateLabel: string;
  completeByDateLabel: string;
  completedDateLabel: string | null;
}

export function formatSurveyDate(value: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "—";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("en-BZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isSurveyOverdue(survey: Pick<PanelistSurvey, "status" | "completeByDate">): boolean {
  if (survey.status === "completed") return false;
  if (!survey.completeByDate) return false;
  const due = new Date(`${survey.completeByDate}T23:59:59`);
  return due.getTime() < Date.now();
}
