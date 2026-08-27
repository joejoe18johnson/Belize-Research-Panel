import Link from "next/link";
import { PointsCoinsIcon } from "./DashboardIcons";

export function PointsBalanceLink({ availablePoints }: { availablePoints: number }) {
  const label = `${availablePoints.toLocaleString()} reward points available`;

  return (
    <Link
      href="/dashboard/rewards"
      className="flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 transition hover:border-amber-400 hover:bg-amber-100/80 dark:border-amber-700/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 sm:min-h-11 sm:px-3.5"
      aria-label={label}
      title={label}
    >
      <PointsCoinsIcon className="h-5 w-5 shrink-0 sm:h-[1.35rem] sm:w-[1.35rem]" />
      <span className="text-sm font-bold tabular-nums leading-none text-amber-950 dark:text-amber-50 sm:text-[0.95rem]">
        {availablePoints.toLocaleString()}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800 dark:text-amber-200 sm:text-xs">
        pts
      </span>
    </Link>
  );
}
