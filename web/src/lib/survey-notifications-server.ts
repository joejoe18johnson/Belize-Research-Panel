import { markAllNotificationsRead } from "./notification-state";
import type { PanelistSurvey } from "./panelist-surveys-types";
import { surveyInvitationNotificationIds } from "./survey-notifications";

export async function markSurveyInvitationsSeen(email: string, inboxSurveys: PanelistSurvey[]): Promise<void> {
  const ids = surveyInvitationNotificationIds(inboxSurveys);
  if (ids.length === 0) return;
  await markAllNotificationsRead(email, ids);
}
