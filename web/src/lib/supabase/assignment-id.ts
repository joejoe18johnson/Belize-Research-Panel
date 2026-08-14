import { cleanText } from "../validation";

export function normalizePanelistEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

/** DB primary key for survey_assignments (import script format). */
export function toDbAssignmentId(campaignId: string, panelistEmail: string): string {
  return `${campaignId}::${normalizePanelistEmail(panelistEmail)}`;
}

/** App routes use campaign id as assignmentId; map DB row id when needed. */
export function resolveDbAssignmentId(campaignId: string, panelistEmail: string): string {
  return toDbAssignmentId(campaignId, panelistEmail);
}
