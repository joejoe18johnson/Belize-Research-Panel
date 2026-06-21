/** Shared light/dark surface tokens for consistent contrast across the site. */

export const adminTableRowHoverClass =
  "border-b border-zinc-50 hover:bg-teal-50/30 dark:border-zinc-800/80 dark:hover:bg-teal-950/30";

export const adminTableHeadRowClass =
  "border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400";

export const adminNewRowHighlightClass =
  "bg-emerald-50 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:ring-emerald-800 dark:hover:bg-emerald-900/50";

export const cardHoverTealClass = "hover:bg-teal-50/50 dark:hover:bg-teal-950/40";

export const filterOptionHoverClass = "hover:bg-teal-50/60 dark:hover:bg-teal-950/40";

export const progressTrackClass = "bg-teal-50 dark:bg-teal-950/60";

export const statusPillClass = {
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  info: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
  neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  draft: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  closed: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200",
} as const;

export const iconMetricToneClass = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
} as const;

export const docPillClass =
  "inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900/50";

export const calloutSkyClass =
  "rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:bg-sky-950/40 dark:text-sky-100";
