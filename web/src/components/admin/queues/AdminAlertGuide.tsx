import Link from "next/link";
import {
  ADMIN_ALERT_SCOPE_GUIDES,
  NOTIFICATION_QUEUE_GUIDES,
  type AdminAlertScope,
} from "@/lib/admin-notification-guide";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminAlertGuide({
  scopeCounts,
  demoLoopEnabled = false,
}: {
  scopeCounts: Partial<Record<AdminAlertScope, number>>;
  demoLoopEnabled?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="max-w-3xl">
        <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">
          {formatHeadingCase("Where admin alerts appear")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Admin alerts use three separate read-state scopes. Unread items show a green highlight in their queue and
          increment the matching sidebar badge.
        </p>
        {demoLoopEnabled ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            <span className="font-semibold">Testing mode:</span> demo notifications reset after each refresh. Mark
            read, approve, and payout actions still run — reload the page to see demo alerts again.
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {ADMIN_ALERT_SCOPE_GUIDES.map((guide) => {
          const unread = scopeCounts[guide.scope] ?? 0;
          return (
            <article
              key={guide.scope}
              className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{guide.title}</h3>
                {unread > 0 ? (
                  <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {unread} unread
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Up to date
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{guide.description}</p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Sidebar:</span> {guide.navLabel}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Marked read:</span>{" "}
                {guide.markedReadWhen}
              </p>
              <Link
                href={guide.href}
                className="mt-3 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
              >
                Open {guide.navLabel} →
              </Link>
            </article>
          );
        })}
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatHeadingCase("Notification queue item types")}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Rows in the table below follow these rules. Green rows are unread in the notifications scope.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
          <table className="min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Where shown</th>
                <th className="px-3 py-2.5">Nav badge</th>
                <th className="px-3 py-2.5">Marked read / completed</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_QUEUE_GUIDES.map((guide) => (
                <tr key={guide.type} className="border-b border-zinc-50 dark:border-zinc-800/80">
                  <td className="px-3 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {guide.filterHref ? (
                      <Link href={guide.filterHref} className="text-teal-700 hover:text-teal-900 dark:text-teal-300">
                        {guide.type}
                      </Link>
                    ) : (
                      guide.type
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400">{guide.whereShown}</td>
                  <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400">{guide.navBadge}</td>
                  <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400">{guide.markedReadWhen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
