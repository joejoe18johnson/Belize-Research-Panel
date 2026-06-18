import { DashboardSurveysSection } from "@/components/dashboard/DashboardSurveysSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { SurveyInvitationsSeenEffect } from "@/components/dashboard/SurveyInvitationsSeenEffect";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { getPanelistSurveys } from "@/lib/panelist-surveys";
import { loadNotificationReadState } from "@/lib/notification-state";
import {
  buildSurveyInvitationNotifications,
  getUnreadSurveyInvitationIds,
} from "@/lib/survey-notifications";

export const metadata = {
  title: "Surveys | Belize Research Panel",
};

export default async function DashboardSurveysPage() {
  const account = await requireRegisteredPanelistSession();
  const { inbox, completed } = await getPanelistSurveys(account.email);
  const readState = await loadNotificationReadState(account.email);
  const invitationNotifications = buildSurveyInvitationNotifications(inbox, readState);
  const newSurveyIds = getUnreadSurveyInvitationIds(invitationNotifications);
  const surveysLocked = account.accountStatus === "on_hold";

  const section = dashboardSectionByHref("/dashboard/surveys");
  const SectionIcon = section?.icon;

  return (
    <>
      <SurveyInvitationsSeenEffect />
      <DashboardPageHeader
        title="Surveys"
        description={
          surveysLocked
            ? "Surveys are unavailable while your account is on hold. Complete email or phone verification to participate again."
            : "View invitations in your inbox and surveys you have already completed."
        }
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
      />
      <DashboardSurveysSection
        inbox={inbox}
        completed={completed}
        newSurveyIds={newSurveyIds}
        surveysLocked={surveysLocked}
        holdReason={account.holdReason}
      />
    </>
  );
}
