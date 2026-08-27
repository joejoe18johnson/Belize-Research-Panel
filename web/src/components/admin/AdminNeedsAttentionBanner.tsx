"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminNavBadges } from "@/lib/admin-nav-badges";
import { formatHeadingCase } from "@/lib/sentence-case";

const ATTENTION_ITEMS: Array<{ slug: string; label: string; href: string }> = [
  { slug: "notifications", label: "Notifications", href: "/admin/notifications" },
  { slug: "under-review", label: "Under Review", href: "/admin/under-review?queue=pending" },
  { slug: "payouts", label: "Payouts", href: "/admin/payouts" },
  { slug: "campaigns", label: "Completed campaigns", href: "/admin/campaigns" },
];

export function AdminNeedsAttentionBanner({ badges }: { badges: AdminNavBadges }) {
  const pathname = usePathname();
  const items = ATTENTION_ITEMS.map((item) => ({
    ...item,
    count: badges[item.slug] ?? 0,
  })).filter((item) => item.count > 0);

  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-50 sm:px-6"
      role="status"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold">
          {formatHeadingCase("Needs action")}
          <span className="ml-2 rounded-full bg-amber-600 px-2 py-0.5 text-xs font-bold text-white">
            {total}
          </span>
          <span className="ml-2 font-normal text-amber-900 dark:text-amber-100">
            New items are waiting in the queues below.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const active = pathname.startsWith(item.href.split("?")[0] ?? item.href);
            return (
              <Link
                key={item.slug}
                href={item.href}
                className={`inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-semibold transition ${
                  active
                    ? "bg-amber-700 text-white"
                    : "bg-white text-amber-950 ring-1 ring-amber-300 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-50 dark:ring-amber-700 dark:hover:bg-amber-800"
                }`}
              >
                {item.label}
                <span className="ml-1.5 tabular-nums">{item.count}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
