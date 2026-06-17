/** Branded alert, notification, and modal surface tokens (Belize Research Panel teal). */
export type FeedbackTone = "info" | "success" | "warning" | "error";

export const brandedAlertSurfaceClass: Record<FeedbackTone, string> = {
  info: "border border-teal-200 bg-gradient-to-br from-teal-50/95 to-white text-teal-950 shadow-sm shadow-teal-950/5 dark:border-teal-800 dark:from-teal-950/80 dark:to-zinc-900 dark:text-teal-100 dark:shadow-black/20",
  success:
    "border border-teal-300 bg-teal-50 text-teal-950 shadow-sm shadow-teal-950/8 ring-1 ring-inset ring-teal-100 dark:border-teal-700 dark:bg-teal-950/50 dark:text-teal-100 dark:ring-teal-900",
  warning:
    "border border-teal-300/70 bg-teal-50/90 text-teal-950 shadow-sm shadow-teal-950/5 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100",
  error:
    "border border-red-200 bg-red-50 text-red-950 shadow-sm shadow-red-950/5 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
};

export const brandedAlertIconWrapClass: Record<FeedbackTone, string> = {
  info: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200",
  success: "bg-teal-700 text-white dark:bg-teal-600",
  warning: "bg-teal-100 text-teal-800 ring-2 ring-amber-200/80 dark:bg-amber-900/50 dark:text-amber-200 dark:ring-amber-800/50",
  error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

export const brandedModalOverlayClass =
  "fixed inset-0 z-50 flex items-end justify-center bg-teal-950/45 p-4 backdrop-blur-[2px] sm:items-center dark:bg-black/60";

export const brandedModalPanelClass =
  "max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-teal-100 bg-white shadow-2xl shadow-teal-950/20 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40";

export const brandedModalHeaderClass =
  "sticky top-0 flex items-center justify-between border-b border-teal-100 bg-gradient-to-r from-teal-50/90 to-white px-5 py-4 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-900";

export const brandedModalFooterClass =
  "flex flex-wrap gap-3 border-t border-teal-100 bg-teal-50/30 px-5 py-4 dark:border-zinc-700 dark:bg-zinc-950/80";

export const brandedNotificationUnreadClass =
  "border-teal-200 bg-teal-50/50 shadow-sm shadow-teal-950/5 dark:border-teal-800 dark:bg-teal-950/40 dark:shadow-black/20";

export const brandedNotificationBadgeClass =
  "rounded-full bg-teal-700 px-2.5 py-0.5 text-[10px] font-semibold text-white dark:bg-teal-600";

export const brandedNotificationPriorityClass =
  "rounded-full border border-teal-300 bg-teal-100 px-2.5 py-0.5 text-[10px] font-semibold text-teal-900 dark:border-teal-700 dark:bg-teal-900 dark:text-teal-100";
