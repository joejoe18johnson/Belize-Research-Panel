"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DonutBreakdown, HorizontalBarChart } from "@/components/admin/analytics/AnalyticsCharts";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import type { AdminModuleSnapshot, AdminTableColumn } from "@/lib/admin-snapshot-types";
import { formatHeadingCase } from "@/lib/sentence-case";

function SortableTable({
  title,
  columns,
  rows,
  note,
}: {
  title: string;
  columns: AdminTableColumn[];
  rows: Record<string, string | number>[];
  note?: string;
}) {
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? "label");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const factor = direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return factor * (av - bv);
      return factor * String(av ?? "").localeCompare(String(bv ?? ""), undefined, { sensitivity: "base" });
    });
  }, [rows, sortKey, direction]);

  const pagination = useTablePagination(sorted);

  const toggle = (key: string) => {
    if (sortKey === key) setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDirection(typeof rows[0]?.[key] === "number" ? "desc" : "asc");
    }
  };

  const indicator = (key: string) => (sortKey === key ? (direction === "asc" ? " ↑" : " ↓") : "");

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
        <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase(title)}</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{sorted.length} rows · click headers to sort</p>
        {note ? <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{note}</p> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 ${column.align === "right" ? "text-right" : ""}`}>
                  <button type="button" onClick={() => toggle(column.key)} className="font-semibold hover:text-teal-800 dark:text-teal-200">
                    {column.label}
                    {indicator(column.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                  No data available.
                </td>
              </tr>
            ) : (
              pagination.paginatedRows.map((row, index) => (
                <tr key={`${title}-${index}`} className="border-b border-zinc-50 last:border-0 hover:bg-teal-50/30">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-2.5 ${column.align === "right" ? "text-right tabular-nums" : ""} text-zinc-700 dark:text-zinc-300`}
                    >
                      {row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sorted.length > 0 ? (
        <div className="px-5 pb-4">
          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalPages={pagination.totalPages}
            totalRows={pagination.totalRows}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      ) : null}
    </section>
  );
}

export function AdminDataModuleDashboard({ snapshot }: { snapshot: AdminModuleSnapshot }) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro eyebrow={snapshot.eyebrow} title={snapshot.title} description={snapshot.description} />

      {snapshot.metrics.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.metrics.map((metric) => (
            <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
          ))}
        </div>
      ) : null}

      {snapshot.links?.length ? (
        <div className="flex flex-wrap gap-3">
          {snapshot.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}

      {snapshot.charts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {snapshot.charts.map((chart) =>
            chart.type === "bar" ? (
              <HorizontalBarChart key={chart.id} rows={chart.rows} title={chart.title} />
            ) : (
              <DonutBreakdown key={chart.id} rows={chart.rows} title={chart.title} />
            )
          )}
        </div>
      ) : null}

      <div className="space-y-4">
        {snapshot.tables.map((table) => (
          <SortableTable key={table.id} title={table.title} columns={table.columns} rows={table.rows} note={table.note} />
        ))}
      </div>
    </div>
  );
}
