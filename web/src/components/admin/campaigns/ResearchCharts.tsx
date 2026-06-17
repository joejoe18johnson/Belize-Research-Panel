"use client";

import type { AnalyticsCountRow } from "@/lib/admin-analytics";
import type { CompletionByDay, RatingHistogramBin } from "@/lib/campaign-results-analytics";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

export function CompletionTimelineChart({
  rows,
  title,
}: {
  rows: CompletionByDay[];
  title: string;
}) {
  const maxCount = rows.reduce((max, row) => Math.max(max, row.count), 0);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-teal-950">{formatHeadingCase(title)}</h3>
        <p className="mt-4 text-sm text-zinc-500">No completed responses yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-teal-950">{formatHeadingCase(title)}</h3>
      <p className="mt-1 text-xs text-zinc-500">Daily count of submitted questionnaires</p>
      <div className="mt-5 flex h-40 items-end gap-2 border-b border-l border-zinc-200 pb-2 pl-2">
        {rows.map((row) => {
          const height = maxCount > 0 ? Math.max(8, (row.count / maxCount) * 100) : 8;
          return (
            <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-teal-800">{row.count}</span>
              <div
                className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-teal-700 to-teal-500"
                style={{ height: `${height}%` }}
                title={`${row.date}: ${row.count}`}
              />
              <span className="max-w-full truncate text-[10px] text-zinc-500" title={row.date}>
                {row.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RatingHistogramChart({
  bins,
  title,
  minLabel,
  maxLabel,
}: {
  bins: RatingHistogramBin[];
  title: string;
  minLabel?: string;
  maxLabel?: string;
}) {
  const maxCount = bins.reduce((max, bin) => Math.max(max, bin.count), 0);

  if (bins.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
      <h4 className="text-xs font-semibold text-zinc-600">{formatHeadingCase(title)}</h4>
      <div className="mt-4 flex h-36 items-end gap-2">
        {bins.map((bin) => {
          const height = maxCount > 0 ? Math.max(6, (bin.count / maxCount) * 100) : 6;
          return (
            <div key={bin.value} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] tabular-nums text-zinc-600">{bin.count}</span>
              <div
                className="w-full rounded-t bg-teal-600"
                style={{ height: `${height}%` }}
                title={`${bin.value}: ${bin.count} (${bin.percent}%)`}
              />
              <span className="text-xs font-semibold text-zinc-700">{bin.value}</span>
            </div>
          );
        })}
      </div>
      {minLabel || maxLabel ? (
        <div className="mt-2 flex justify-between gap-2 text-[10px] text-zinc-500">
          <span>{minLabel ?? ""}</span>
          <span>{maxLabel ?? ""}</span>
        </div>
      ) : null}
    </div>
  );
}

export function FunnelChart({
  steps,
  title,
}: {
  steps: { label: string; count: number; percent: number }[];
  title: string;
}) {
  const maxCount = steps[0]?.count ?? 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-teal-950">{formatHeadingCase(title)}</h3>
      <ul className="mt-4 space-y-3">
        {steps.map((step, index) => {
          const width = maxCount > 0 ? Math.max(12, (step.count / maxCount) * 100) : 12;
          return (
            <li key={step.label}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-zinc-800">
                  {index + 1}. {formatAdminLabel(step.label)}
                </span>
                <span className="tabular-nums text-zinc-600">
                  {step.count} <span className="text-zinc-400">({step.percent}%)</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-teal-50">
                <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function FrequencyTable({
  rows,
  title,
  denominatorLabel,
}: {
  rows: AnalyticsCountRow[];
  title: string;
  denominatorLabel?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-100">
      <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
        <p className="text-xs font-semibold text-zinc-600">{formatHeadingCase(title)}</p>
        {denominatorLabel ? <p className="text-[11px] text-zinc-500">{denominatorLabel}</p> : null}
      </div>
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-semibold text-zinc-600">
            <th className="px-4 py-2">Response</th>
            <th className="px-4 py-2 text-right">n</th>
            <th className="px-4 py-2 text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                No responses recorded.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.label} className="border-b border-zinc-50 last:border-0">
                <td className="px-4 py-2 font-medium text-zinc-800">{formatAdminLabel(row.label)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{row.count}</td>
                <td className="px-4 py-2 text-right tabular-nums text-zinc-600">{row.percent}%</td>
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 ? (
          <tfoot>
            <tr className="bg-zinc-50/60 text-xs font-semibold text-zinc-600">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right tabular-nums">{total}</td>
              <td className="px-4 py-2 text-right">100%</td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string | number; hint?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-zinc-100 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold text-zinc-600">{formatAdminLabel(stat.label)}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-teal-950">{stat.value}</p>
          {stat.hint ? <p className="mt-0.5 text-xs text-zinc-500">{stat.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
