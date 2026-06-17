"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavBadges } from "@/lib/dashboard-access";
import { APP_CONTENT_MAX } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";
import { DASHBOARD_NAV_SECTIONS } from "./dashboard-sections";

const NAV_BADGE_KEYS: Partial<Record<string, keyof DashboardNavBadges>> = {
  "/dashboard/surveys": "newSurveys",
  "/dashboard/notifications": "unreadNotifications",
  "/dashboard/verification": "verificationAttention",
};

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ badges }: { badges: DashboardNavBadges }) {
  const pathname = usePathname();

  return (
    <nav className="border-t border-teal-50 bg-gradient-to-b from-white to-teal-50/30" aria-label="Dashboard sections">
      <div className="nav-scroll overflow-x-auto overscroll-x-contain">
        <div
          className={`mx-auto flex w-max min-w-full max-w-none snap-x snap-mandatory justify-start gap-1.5 px-3 py-2.5 sm:w-full sm:justify-center sm:gap-2 sm:px-4 sm:py-3 ${APP_CONTENT_MAX}`}
        >
          {DASHBOARD_NAV_SECTIONS.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const badgeKey = NAV_BADGE_KEYS[item.href];
            const badgeCount = badgeKey ? badges[badgeKey] : 0;
            const Icon = item.icon;
            const displayLabel = item.shortLabel ?? item.label;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                  active
                    ? "bg-teal-700 text-white shadow-md shadow-teal-900/20"
                    : "text-teal-900/70 hover:bg-teal-50 hover:text-teal-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                <span>{formatHeadingCase(displayLabel)}</span>
                {badgeCount > 0 ? (
                  <span
                    className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      badgeKey === "newSurveys"
                        ? active
                          ? "bg-amber-300 text-amber-950 ring-2 ring-white/50"
                          : "animate-pulse bg-amber-500 text-white shadow-sm"
                        : active
                          ? "bg-white/20 text-white"
                          : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {badgeKey === "newSurveys"
                        ? badgeCount === 1
                          ? "NEW"
                          : badgeCount > 9
                            ? "9+"
                            : badgeCount
                        : badgeCount > 9
                          ? "9+"
                          : badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
