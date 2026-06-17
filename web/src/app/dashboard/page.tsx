import { DashboardOverviewSection } from "@/components/dashboard/DashboardOverviewSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { getPanelistSurveys } from "@/lib/panelist-surveys";

export const metadata = {
  title: "Overview | Belize Research Panel",
};

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const { account, profile, rewards, notifications } = await requireDashboardContext({
    welcome: welcome === "1",
  });
  const { inbox } = await getPanelistSurveys(account.email);

  const section = dashboardSectionByHref("/dashboard");
  const SectionIcon = section?.icon;

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description="Your panel status at a glance."
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
      />
      <DashboardOverviewSection
        profile={profile}
        rewards={rewards}
        notifications={notifications}
        inboxSurveys={inbox}
        accountStatus={account.accountStatus}
        welcome={welcome === "1"}
      />
    </>
  );
}
