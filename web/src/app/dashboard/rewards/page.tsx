import { DashboardRewardsSection } from "@/components/dashboard/DashboardRewardsSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { loadRedemptionRequests } from "@/lib/redemption-requests";
import { isPointsOverrideEnabled } from "@/lib/panelist-points";

export const metadata = {
  title: "Rewards | Belize Research Panel",
};

export default async function DashboardRewardsPage() {
  const { account, rewards } = await requireDashboardContext();
  const redemptionRequests = await loadRedemptionRequests(account.email);

  return (
    <>
      <DashboardPageHeader
        title="Rewards"
        description="Track your points (500 pts = BZ$20), view redemption tiers, and submit a request when eligible."
      />
      <DashboardRewardsSection
        rewards={rewards}
        redemptionRequests={redemptionRequests}
        showDevPointsEditor={isPointsOverrideEnabled()}
      />
    </>
  );
}
