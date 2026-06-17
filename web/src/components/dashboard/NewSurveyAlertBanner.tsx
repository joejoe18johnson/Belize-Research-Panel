"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";

const DISMISS_KEY = "brp-new-survey-banner-dismissed";

export function NewSurveyAlertBanner({ newSurveyCount }: { newSurveyCount: number }) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (newSurveyCount <= 0) {
      setDismissed(true);
      return;
    }
    if (pathname.startsWith("/dashboard/surveys")) {
      setDismissed(true);
      return;
    }
    const stored = sessionStorage.getItem(DISMISS_KEY);
    setDismissed(stored === String(newSurveyCount));
  }, [newSurveyCount, pathname]);

  if (newSurveyCount <= 0 || dismissed) {
    return null;
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, String(newSurveyCount));
    setDismissed(true);
  };

  return (
    <div
      className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-amber-100/90 to-amber-50"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white shadow-sm">
            {newSurveyCount > 9 ? "9+" : newSurveyCount}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-950">
              {formatHeadingCase(
                newSurveyCount === 1
                  ? "New survey invitation waiting for you"
                  : `${newSurveyCount} new survey invitations waiting for you`
              )}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-900/80">
              {formatHeadingCase("Open your surveys inbox to participate and earn points.")}
            </p>
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <Link
            href="/dashboard/surveys"
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 sm:flex-none"
          >
            {formatHeadingCase("View surveys")}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-white/80 px-3 text-sm font-semibold text-amber-900 transition hover:bg-white dark:bg-zinc-900"
            aria-label="Dismiss new survey alert"
          >
            {formatHeadingCase("Dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
