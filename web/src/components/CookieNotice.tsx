"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { acceptCookieNotice, hasAcceptedCookieNotice } from "@/lib/cookie-notice";
import { appContentClass } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

export function CookieNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setVisible(false);
      return;
    }
    setVisible(!hasAcceptedCookieNotice());
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (!visible) {
      root.style.removeProperty("--brp-cookie-notice-offset");
      return;
    }
    root.style.setProperty("--brp-cookie-notice-offset", "7.5rem");
    return () => {
      root.style.removeProperty("--brp-cookie-notice-offset");
    };
  }, [visible]);

  if (!visible) return null;

  const accept = () => {
    acceptCookieNotice();
    setVisible(false);
  };

  return (
    <div
      className="safe-bottom fixed inset-x-0 z-50 border-t border-teal-200/80 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-teal-900/60 dark:bg-zinc-950/95 dark:shadow-black/40"
      role="dialog"
      aria-label={formatHeadingCase("Cookie notice")}
      aria-describedby="cookie-notice-copy"
      style={{
        bottom: "var(--brp-mobile-bottom-nav-offset, 0px)",
      }}
    >
      <div className={`${appContentClass} px-4 py-4 sm:px-6 sm:py-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0 max-w-3xl">
            <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">
              {formatHeadingCase("Cookies on this site")}
            </p>
            <p
              id="cookie-notice-copy"
              className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
            >
              {formatHeadingCase(
                "We use essential cookies and browser storage to keep you signed in, protect the site, remember your preferences, and save unfinished registration or survey drafts. We do not use advertising or third-party tracking cookies."
              )}{" "}
              <Link
                href="/cookie-policy"
                className="font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
              >
                {formatHeadingCase("Read our cookie policy")}
              </Link>
              .
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/cookie-policy"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {formatHeadingCase("Learn more")}
            </Link>
            <button
              type="button"
              onClick={accept}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              {formatHeadingCase("Got it")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
