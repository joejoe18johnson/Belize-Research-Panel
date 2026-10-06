import Link from "next/link";
import { WalletIcon } from "./DashboardIcons";

export function PointsBalanceLink({ availablePoints }: { availablePoints: number }) {
  const amount = availablePoints.toLocaleString();
  const noun = availablePoints === 1 ? "Point" : "Points";
  const label = `${amount} ${noun}`;

  return (
    <Link
      href="/dashboard/rewards"
      className="flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-900 transition hover:border-amber-400 hover:bg-amber-100/80 dark:border-amber-700/80 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/70 sm:min-h-11 sm:px-3.5"
      aria-label={`${label} available`}
      title={`${label} available`}
    >
      <WalletIcon className="h-5 w-5 shrink-0" />
      <span className="whitespace-nowrap text-sm font-bold leading-none">{label}</span>
    </Link>
  );
}
