import type { DashboardNotification } from "./panelist-dashboard";
import type { NotificationReadState } from "./notification-state";
import type { PanelistSurvey } from "./panelist-surveys-types";
import { cleanText } from "./validation";

export const SURVEY_INVITATION_NOTIFICATION_PREFIX = "survey-invitation:";

export function surveyInvitationNotificationId(assignmentId: string): string {
  return `${SURVEY_INVITATION_NOTIFICATION_PREFIX}${cleanText(assignmentId)}`;
}

export function isSurveyInvitationNotificationId(id: string): boolean {
  return id.startsWith(SURVEY_INVITATION_NOTIFICATION_PREFIX);
}

function parseSurveyAssignedSortAt(value: string): string {
  const trimmed = cleanText(value);
  if (!trimmed) return new Date().toISOString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`).toISOString();
  }
  const ms = Date.parse(trimmed);
  return Number.isNaN(ms) ? new Date().toISOString() : new Date(ms).toISOString();
}

function formatSurveyNotificationDateLabel(survey: PanelistSurvey): string {
  return survey.assignedDateLabel || survey.assignedDate || "Recently";
}

export function buildSurveyInvitationNotifications(
  inboxSurveys: PanelistSurvey[],
  readState: NotificationReadState
): DashboardNotification[] {
  const isUnread = (id: string, defaultUnread: boolean): boolean => {
    const stored = readState[id];
    if (stored) return !stored.read;
    return defaultUnread;
  };

  return inboxSurveys
    .filter((survey) => survey.status !== "completed")
    .map((survey) => {
      const id = surveyInvitationNotificationId(survey.id);
      const sortAt = parseSurveyAssignedSortAt(survey.assignedDate);
      const dueLabel = survey.completeByDateLabel || survey.completeByDate;
      const defaultUnread = survey.status === "available";

      return {
        id,
        title: survey.status === "in_progress" ? "Survey in progress" : "New survey invitation",
        body:
          survey.status === "in_progress"
            ? `Continue "${survey.title}" — ${survey.progressPercent}% complete. Due ${dueLabel}.`
            : `"${survey.title}" is ready for you. Earn ${survey.points} points — due ${dueLabel}.`,
        dateLabel: formatSurveyNotificationDateLabel(survey),
        sortAt,
        priority: survey.status === "available" ? ("high" as const) : ("normal" as const),
        unread: isUnread(id, defaultUnread),
      };
    });
}

export function countUnreadSurveyInvitations(notifications: DashboardNotification[]): number {
  return notifications.filter(
    (notification) => notification.unread && isSurveyInvitationNotificationId(notification.id)
  ).length;
}

export function surveyInvitationNotificationIds(inboxSurveys: PanelistSurvey[]): string[] {
  return inboxSurveys
    .filter((survey) => survey.status !== "completed")
    .map((survey) => surveyInvitationNotificationId(survey.id));
}
