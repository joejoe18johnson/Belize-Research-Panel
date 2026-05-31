import { DashboardSurveysSection } from "@/components/dashboard/DashboardSurveysSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { getPanelistSurveys } from "@/lib/panelist-surveys";

export const metadata = {
  title: "Surveys | Belize Research Panel",
};

export default async function DashboardSurveysPage() {
  const account = await requireRegisteredPanelistSession();
  const { inbox, completed } = await getPanelistSurveys(account.email);
  const surveysLocked = account.accountStatus === "on_hold";

  return (
    <>
      <DashboardPageHeader
        title="Surveys"
        description={
          surveysLocked
            ? "Surveys are unavailable while your account is on hold. Complete email or phone verification to participate again."
            : "View invitations in your inbox and surveys you have already completed."
        }
      />
      <DashboardSurveysSection
        inbox={inbox}
        completed={completed}
        surveysLocked={surveysLocked}
        holdReason={account.holdReason}
      />
    </>
  );
}
