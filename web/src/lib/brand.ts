/** Shared Belize Research Panel brand tokens for dashboard and marketing surfaces. */
export const BRAND = {
  teal: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
} as const;

export const dashboardShellClass = "min-h-screen bg-[linear-gradient(180deg,#f0fdfa_0%,#f4f4f5_12rem,#f4f4f5_100%)]";

export const dashboardHeaderClass =
  "safe-top sticky top-0 z-20 border-b border-teal-100 bg-white/95 shadow-sm shadow-teal-950/5 backdrop-blur-sm";

export const dashboardCardClass =
  "rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-teal-950/[0.03] sm:p-6";

export const dashboardHeroCardClass =
  "overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-0 text-white shadow-md shadow-teal-950/20";

export const dashboardPrimaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800";

export const dashboardSecondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-50";
