import { DashboardOverviewSection } from "@/components/dashboard/DashboardOverviewSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
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

  return (
    <>
      <DashboardPageHeader
        title="Overview"
        description="Your panel status at a glance."
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
