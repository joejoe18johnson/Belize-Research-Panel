import { DashboardPayoutsSection } from "@/components/dashboard/DashboardPayoutsSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { loadRedemptionRequests } from "@/lib/redemption-requests";
import Link from "next/link";

export const metadata = {
  title: "Payouts | Belize Research Panel",
};

export default async function DashboardPayoutsPage() {
  const { account } = await requireDashboardContext();
  const redemptionRequests = await loadRedemptionRequests(account.email);

  const section = dashboardSectionByHref("/dashboard/payouts");
  const SectionIcon = section?.icon;

  return (
    <>
      <DashboardPageHeader
        title="Payouts"
        description="Track open payout requests and review your payment history."
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
        action={
          <Link
            href="/dashboard/rewards"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            View rewards
          </Link>
        }
      />
      <DashboardPayoutsSection requests={redemptionRequests} />
    </>
  );
}
