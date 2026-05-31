import Link from "next/link";
import { RedemptionRequestForm } from "@/components/dashboard/RedemptionRequestForm";
import { RedemptionRequestHistory } from "@/components/dashboard/RedemptionOptionsCatalog";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { loadRedemptionRequests } from "@/lib/redemption-requests";
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
  const redemptionRequests = await loadRedemptionRequests(account.email);

  const initialOptionId = optionParam ? getRedemptionOption(optionParam)?.id : undefined;

  return (
    <>
      <DashboardPageHeader
        title="Redeem points"
        description={`${REDEMPTION_RATE_LABEL}. Submit your details for the reward you want — requests are reviewed before payout.`}
        action={
          <Link
            href="/dashboard/rewards"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
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
        <RedemptionRequestHistory requests={redemptionRequests} />
      </div>
    </>
  );
}
