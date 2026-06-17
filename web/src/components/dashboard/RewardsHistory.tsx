"use client";

import { useMemo, useState } from "react";
import type { RewardsHistoryEntry } from "@/lib/rewards-history";
import { withdrawalStatusLabel } from "@/lib/rewards-history";
import { formatBz } from "@/lib/reward-redemption";
import type { ViewLayout } from "@/lib/view-layout";
import { viewLayoutContainerClass, viewLayoutItemClass } from "@/lib/view-layout";
import { ViewLayoutToggle, useViewLayout } from "@/components/shared/ViewLayoutToggle";
import { formatHeadingCase } from "@/lib/sentence-case";
import { DashboardCard, SectionHeading } from "./DashboardShell";

type HistoryFilter = "all" | "earned" | "withdrawals";

function statusTone(status: NonNullable<RewardsHistoryEntry["status"]>): string {
  switch (status) {
    case "fulfilled":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "approved":
      return "bg-teal-50 text-teal-800 border-teal-200";
    case "rejected":
      return "bg-red-50 text-red-800 border-red-200";
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

function pointsTone(points: number): string {
  return points >= 0 ? "text-emerald-700" : "text-amber-800";
}

function HistoryIcon({ kind }: { kind: RewardsHistoryEntry["kind"] }) {
  if (kind === "withdrawal") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.172-.879-1.172-2.303 0-3.182C10.464 7.781 11.232 7.562 12 7.562c.768 0 1.536.219 2.121.659ZM12 6V4.5m0 0V3.75m0 1.5h.008v.008H12V6Z" />
      </svg>
    </span>
  );
}

function HistoryEntryCard({ entry, layout }: { entry: RewardsHistoryEntry; layout: ViewLayout }) {
  if (layout === "cards") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
        <div className="flex items-start gap-3">
          <HistoryIcon kind={entry.kind} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-900">{formatHeadingCase(entry.title)}</p>
            <p className="mt-1 text-sm text-zinc-600">{entry.detail}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">{entry.dateLabel}</p>
              <span className={`text-sm font-bold tabular-nums ${pointsTone(entry.points)}`}>
                {entry.points >= 0 ? "+" : "−"}
                {Math.abs(entry.points)} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-1">
      <HistoryIcon kind={entry.kind} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900">{formatHeadingCase(entry.title)}</p>
            <p className="mt-0.5 text-sm text-zinc-600">{entry.detail}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>{entry.dateLabel}</span>
              {entry.referenceId ? <span>Ref {entry.referenceId}</span> : null}
              {entry.amountBz ? <span>{formatBz(entry.amountBz)}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={`text-sm font-bold tabular-nums ${pointsTone(entry.points)}`}>
              {entry.points >= 0 ? "+" : "−"}
              {Math.abs(entry.points)} pts
            </span>
            {entry.status ? (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(entry.status)}`}>
                {formatHeadingCase(withdrawalStatusLabel(entry.status))}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RewardsHistory({ entries }: { entries: RewardsHistoryEntry[] }) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [layout, setLayout] = useViewLayout("dashboard-rewards-history");

  const earnedCount = entries.filter((entry) => entry.kind === "earned").length;
  const withdrawalCount = entries.filter((entry) => entry.kind === "withdrawal").length;

  const filtered = useMemo(() => {
    if (filter === "earned") return entries.filter((entry) => entry.kind === "earned");
    if (filter === "withdrawals") return entries.filter((entry) => entry.kind === "withdrawal");
    return entries;
  }, [entries, filter]);

  return (
    <DashboardCard>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <SectionHeading as="h3">Rewards history</SectionHeading>
          <p className="mt-1 text-sm text-zinc-500">
            Points earned and withdrawal requests on your account.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <ViewLayoutToggle value={layout} onChange={setLayout} />
          <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: `All (${entries.length})` },
              { id: "earned" as const, label: `Earned (${earnedCount})` },
              { id: "withdrawals" as const, label: `Withdrawals (${withdrawalCount})` },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === item.id
                  ? "bg-teal-700 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-teal-50"
              }`}
            >
              {item.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
          <p className="font-medium text-zinc-800">
            {filter === "withdrawals"
              ? formatHeadingCase("No withdrawal requests yet")
              : formatHeadingCase("No rewards activity yet")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {filter === "withdrawals"
              ? "When you redeem points, your withdrawal requests will appear here with live status updates."
              : "Complete registration, verification, and surveys to earn points."}
          </p>
        </div>
      ) : (
        <div className={`mt-4 ${viewLayoutContainerClass(layout, layout === "list" ? "divide-y divide-zinc-100" : "grid gap-4 sm:grid-cols-2")}`}>
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className={`${viewLayoutItemClass(layout, "w-[min(88vw,16rem)]")} ${layout === "list" ? "py-4 first:pt-2" : ""}`}
            >
              <HistoryEntryCard entry={entry} layout={layout} />
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
