import { DashboardSurveysSection } from "@/components/dashboard/DashboardSurveysSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { getPanelistSurveys } from "@/lib/panelist-surveys";

export const metadata = {
  title: "Surveys | Belize Research Panel",
};

export default async function DashboardSurveysPage() {
  const account = await requireRegisteredPanelistSession();
  const { inbox, completed } = await getPanelistSurveys(account.email);
  const surveysLocked = account.accountStatus === "on_hold";

  const section = dashboardSectionByHref("/dashboard/surveys");
  const SectionIcon = section?.icon;

  return (
    <>
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
        surveysLocked={surveysLocked}
        holdReason={account.holdReason}
      />
    </>
  );
}
