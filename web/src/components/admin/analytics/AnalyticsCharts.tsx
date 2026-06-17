"use client";

import { useMemo, useState } from "react";
import type { AnalyticsCountRow } from "@/lib/admin-analytics";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

const AGE_GROUP_ORDER = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Unknown"];

export function HorizontalBarChart({
  rows,
  title,
  maxBars = 12,
  emptyMessage = "No data for current filters.",
}: {
  rows: AnalyticsCountRow[];
  title: string;
  maxBars?: number;
  emptyMessage?: string;
}) {
  const display = rows.slice(0, maxBars);
  const maxCount = display[0]?.count ?? 0;

  if (display.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase(title)}</h3>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase(title)}</h3>
      <ul className="mt-4 space-y-3">
        {display.map((row) => {
          const width = maxCount > 0 ? Math.max(4, (row.count / maxCount) * 100) : 0;
          return (
            <li key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-zinc-200" title={row.label}>
                  {formatAdminLabel(row.label)}
                </span>
                <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                  {row.count} <span className="text-zinc-400 dark:text-zinc-500">({row.percent}%)</span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-teal-50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all"
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DonutBreakdown({
  rows,
  title,
}: {
  rows: AnalyticsCountRow[];
  title: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const colors = ["#0f766e", "#14b8a6", "#5eead4", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];
  const segments = rows.slice(0, 7);

  if (segments.length === 0 || total === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase(title)}</h3>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">No data for current filters.</p>
      </div>
    );
  }

  let cumulative = 0;
  const gradientParts = segments.map((row, index) => {
    const start = cumulative;
    cumulative += (row.count / total) * 100;
    return `${colors[index % colors.length]} ${start}% ${cumulative}%`;
  });

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase(title)}</h3>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className="relative h-32 w-32 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradientParts.join(", ")})` }}
        >
          <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 text-center">
            <span className="text-lg font-bold text-teal-950 dark:text-teal-100">{total}</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2 text-sm">
          {segments.map((row, index) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="truncate">{formatAdminLabel(row.label)}</span>
              </span>
              <span className="shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.percent}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

type SortKey = "label" | "count" | "percent";

export function SortableAnalyticsTable({
  rows,
  title,
  labelHeader = "Category",
  defaultSort = "count" as SortKey,
  defaultDirection = "desc" as "asc" | "desc",
  preserveLabelOrder,
}: {
  rows: AnalyticsCountRow[];
  title: string;
  labelHeader?: string;
  defaultSort?: SortKey;
  defaultDirection?: "asc" | "desc";
  /** When set, label sort uses this order instead of alphabetical. */
  preserveLabelOrder?: string[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>(defaultSort);
  const [direction, setDirection] = useState<"asc" | "desc">(defaultDirection);

  const sorted = useMemo(() => {
    const factor = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === "label") {
        if (preserveLabelOrder) {
          return factor * (preserveLabelOrder.indexOf(a.label) - preserveLabelOrder.indexOf(b.label));
        }
        return factor * a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
      }
      return factor * (a[sortKey] - b[sortKey]);
    });
  }, [rows, sortKey, direction, preserveLabelOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection(key === "label" ? "asc" : "desc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
        <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase(title)}</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{sorted.length} rows · click headers to sort</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("label")} className="font-semibold hover:text-teal-800 dark:text-teal-200">
                  {formatAdminLabel(labelHeader)}
                  {sortIndicator("label")}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button type="button" onClick={() => toggleSort("count")} className="font-semibold hover:text-teal-800 dark:text-teal-200">
                  Count
                  {sortIndicator("count")}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button type="button" onClick={() => toggleSort("percent")} className="font-semibold hover:text-teal-800 dark:text-teal-200">
                  Share
                  {sortIndicator("percent")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                  No data for current filters.
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={row.label} className="border-b border-zinc-50 last:border-0 hover:bg-teal-50/30">
                  <td className="max-w-[16rem] truncate px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200" title={row.label}>
                    {formatAdminLabel(row.label)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{row.count}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.percent}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { AGE_GROUP_ORDER };
