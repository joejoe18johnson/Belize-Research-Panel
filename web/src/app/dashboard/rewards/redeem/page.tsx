import Link from "next/link";
import { RedemptionRequestForm } from "@/components/dashboard/RedemptionRequestForm";
import { RewardsHistory } from "@/components/dashboard/RewardsHistory";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { loadRedemptionRequests } from "@/lib/redemption-requests";
import { getPanelistSurveys } from "@/lib/panelist-surveys";
import { buildRewardsHistory } from "@/lib/rewards-history";
import { REDEMPTION_RATE_LABEL, getRedemptionOption } from "@/lib/reward-redemption";

export const metadata = {
  title: "Redeem points | Belize Research Panel",
};

export default async function RedeemPointsPage({
  searchParams,
}: {
  searchParams: Promise<{ option?: string }>;
}) {
  const { option: optionParam } = await searchParams;
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

  const initialOptionId = optionParam ? getRedemptionOption(optionParam)?.id : undefined;

  const section = dashboardSectionByHref("/dashboard/rewards");
  const SectionIcon = section?.icon;

  return (
    <>
      <DashboardPageHeader
        title="Redeem points"
        description={`${REDEMPTION_RATE_LABEL}. Submit your details for the reward you want — requests are reviewed before payout.`}
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
        action={
          <Link
            href="/dashboard/rewards"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            Back to rewards
          </Link>
        }
      />
      <div className="space-y-6">
        <RedemptionRequestForm
          key={initialOptionId ?? "default"}
          totalPoints={rewards.totalPoints}
          requests={redemptionRequests}
          profile={profile}
          accountOnHold={account.accountStatus === "on_hold"}
          initialOptionId={initialOptionId}
          standalone
        />
        <RewardsHistory entries={rewardsHistory} />
      </div>
    </>
  );
}
