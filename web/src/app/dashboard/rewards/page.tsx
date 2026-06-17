import Link from "next/link";
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
        description="Track your points (500 pts = BZ$20), redeem rewards, and review your earnings history."
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
        action={
          <Link
            href="/dashboard/payouts"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            View payouts
          </Link>
        }
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
