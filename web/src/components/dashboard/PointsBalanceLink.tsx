import Link from "next/link";

function GoldCoinsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="8.5" cy="14" rx="5.5" ry="2.25" fill="#FCD34D" stroke="#D97706" strokeWidth="1.25" />
      <ellipse cx="8.5" cy="14" rx="5.5" ry="2.25" fill="url(#coin-shine-a)" />
      <ellipse cx="15.5" cy="10.5" rx="5.5" ry="2.25" fill="#FBBF24" stroke="#D97706" strokeWidth="1.25" />
      <ellipse cx="15.5" cy="10.5" rx="5.5" ry="2.25" fill="url(#coin-shine-b)" />
      <ellipse cx="12" cy="7" rx="5.5" ry="2.25" fill="#FDE68A" stroke="#D97706" strokeWidth="1.25" />
      <ellipse cx="12" cy="7" rx="5.5" ry="2.25" fill="url(#coin-shine-c)" />
      <defs>
        <linearGradient id="coin-shine-a" x1="3" y1="12" x2="14" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="coin-shine-b" x1="10" y1="8.5" x2="21" y2="12.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="coin-shine-c" x1="6.5" y1="5" x2="17.5" y2="9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function PointsBalanceLink({ availablePoints }: { availablePoints: number }) {
  const label = `${availablePoints.toLocaleString()} reward points available`;

  return (
    <Link
      href="/dashboard/rewards"
      className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-amber-300/80 bg-gradient-to-br from-amber-50 via-amber-100/90 to-yellow-100 px-2.5 py-1.5 shadow-sm shadow-amber-900/5 transition hover:border-amber-400 hover:from-amber-100 hover:to-amber-50 sm:min-h-11 sm:gap-2 sm:px-3"
      aria-label={label}
      title={label}
    >
      <GoldCoinsIcon className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
      <span className="text-sm font-bold tabular-nums leading-none text-amber-950 sm:text-base">
        {availablePoints.toLocaleString()}
      </span>
      <span className="hidden text-xs font-semibold uppercase tracking-wide text-amber-800 sm:inline">pts</span>
    </Link>
  );
}
