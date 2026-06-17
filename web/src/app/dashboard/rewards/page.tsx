import { DashboardRewardsSection } from "@/components/dashboard/DashboardRewardsSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { loadRedemptionRequests } from "@/lib/redemption-requests";
import { isPointsOverrideEnabled } from "@/lib/panelist-points";
import { getPanelistSurveys } from "@/lib/panelist-surveys";
import { buildRewardsHistory } from "@/lib/rewards-history";

export const metadata = {
  title: "Rewards | Belize Research Panel",
};

export default async function DashboardRewardsPage() {
  const { account, profile, rewards } = await requireDashboardContext();
  const [redemptionRequests, { completed }] = await Promise.all([
    loadRedemptionRequests(account.email),
    getPanelistSurveys(account.email),
  ]);
  const rewardsHistory = buildRewardsHistory({
    rewards,
    profile,
    completedSurveys: completed,
    redemptionRequests,
  });

  const section = dashboardSectionByHref("/dashboard/rewards");
  const SectionIcon = section?.icon;

  return (
    <>
      <DashboardPageHeader
        title="Rewards"
        description="Track your points (500 pts = BZ$20), redeem rewards, and review your earnings and withdrawal history."
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
      />
      <DashboardRewardsSection
        rewards={rewards}
        redemptionRequests={redemptionRequests}
        rewardsHistory={rewardsHistory}
        showDevPointsEditor={isPointsOverrideEnabled()}
      />
    </>
  );
}
