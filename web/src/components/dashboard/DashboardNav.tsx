"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavBadges } from "@/lib/dashboard-access";
import { APP_CONTENT_MAX } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";
import { HomeIcon } from "./DashboardIcons";

const NAV_ITEMS: {
  href: string;
  label: string;
  shortLabel?: string;
  mobileIcon?: "home";
  exact?: boolean;
  badgeKey?: keyof DashboardNavBadges;
}[] = [
  { href: "/dashboard", label: "Overview", mobileIcon: "home", exact: true },
  { href: "/dashboard/surveys", label: "Surveys", shortLabel: "Surveys", badgeKey: "inboxSurveys" },
  { href: "/dashboard/profile", label: "Profile", shortLabel: "Profile" },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    shortLabel: "Alerts",
    badgeKey: "unreadNotifications",
  },
  { href: "/dashboard/rewards", label: "Rewards", shortLabel: "Rewards" },
  {
    href: "/dashboard/verification",
    label: "Verification Center",
    shortLabel: "Verification Center",
    badgeKey: "verificationAttention",
  },
];

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
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-xl py-2 text-xs font-semibold transition sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                  item.mobileIcon === "home" ? "min-w-10 justify-center px-2.5 sm:min-w-0 sm:justify-start sm:px-4" : "px-3"
                } ${
                  active
                    ? "bg-teal-700 text-white shadow-md shadow-teal-900/20"
                    : "text-teal-900/70 hover:bg-teal-50 hover:text-teal-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.mobileIcon === "home" ? (
                  <span className="inline-flex items-center sm:hidden">
                    <HomeIcon className="h-5 w-5" />
                    <span className="sr-only">{formatHeadingCase(item.label)}</span>
                  </span>
                ) : (
                  <span className="sm:hidden">{formatHeadingCase(item.shortLabel ?? item.label)}</span>
                )}
                <span className="hidden sm:inline">{formatHeadingCase(item.label)}</span>
                {badgeCount > 0 ? (
                  <span
                    className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      active ? "bg-white/20 text-white" : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
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
