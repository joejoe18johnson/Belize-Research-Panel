"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DonutBreakdown, HorizontalBarChart } from "@/components/admin/analytics/AnalyticsCharts";
import { MetricCard, PageIntro, AdminNewBadge, adminNewItemRowClass } from "@/components/admin/shared/AdminUi";
import { AdminMarkReadButton } from "@/components/admin/shared/AdminMarkReadButton";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { isCampaignAdminNotifiable } from "@/lib/admin-campaign-notifications";
import type { CampaignSummary } from "@/lib/campaign-targeting";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

function statusBadgeClass(status: CampaignSummary["status"]): string {
  if (status === "active") return "bg-teal-100 text-teal-900 dark:text-teal-100";
  if (status === "closed") return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
  return "bg-amber-100 text-amber-900";
}

export function AdminCampaignsDashboard({
  summaries,
  unreadCampaignIds = [],
}: {
  summaries: CampaignSummary[];
  unreadCampaignIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const unreadSet = useMemo(() => new Set(unreadCampaignIds), [unreadCampaignIds]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return summaries;
    return summaries.filter(
      (row) =>
        row.title.toLowerCase().includes(query) ||
        row.category.toLowerCase().includes(query) ||
        row.targetingLabel.toLowerCase().includes(query)
    );
  }, [summaries, search]);

  const totals = useMemo(() => {
    return summaries.reduce(
      (acc, row) => ({
        assigned: acc.assigned + row.assigned,
        pending: acc.pending + row.pending,
        opened: acc.opened + row.opened,
        completed: acc.completed + row.completed,
        overdue: acc.overdue + row.overdue,
      }),
      { assigned: 0, pending: 0, opened: 0, completed: 0, overdue: 0 }
    );
  }, [summaries]);

  const responseRate = totals.assigned ? Math.round((totals.completed / totals.assigned) * 1000) / 10 : 0;
  const newCompletedCount = summaries.filter(
    (row) => isCampaignAdminNotifiable(row) && unreadSet.has(row.id)
  ).length;

  const statusChart = [
    { label: "Pending", count: totals.pending, percent: totals.assigned ? Math.round((totals.pending / totals.assigned) * 1000) / 10 : 0 },
    { label: "Opened", count: totals.opened, percent: totals.assigned ? Math.round((totals.opened / totals.assigned) * 1000) / 10 : 0 },
    { label: "Completed", count: totals.completed, percent: responseRate },
    { label: "Overdue", count: totals.overdue, percent: totals.assigned ? Math.round((totals.overdue / totals.assigned) * 1000) / 10 : 0 },
  ];

  const categoryChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of summaries) {
      map.set(row.category, (map.get(row.category) ?? 0) + row.assigned);
    }
    const total = totals.assigned || 1;
    return [...map.entries()].map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / total) * 1000) / 10,
    }));
  }, [summaries, totals.assigned]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageIntro
          eyebrow="Survey campaigns"
          title="Campaigns"
          description="Track live and historical survey campaigns with delivery results — pending, opened, completed, and overdue counts per campaign."
          action={<AdminMarkReadButton scope="campaigns" label="Mark completed as read" />}
        />
        <Link
          href="/admin/campaigns/create"
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Create campaign
        </Link>
      </div>

      {newCompletedCount > 0 ? (
        <BrandedAlert tone="success" showIcon>
          <p>
            <span className="font-semibold">{newCompletedCount}</span>{" "}
            {newCompletedCount === 1 ? "newly completed campaign" : "newly completed campaigns"} highlighted in green
            below. Open <span className="font-semibold">View results</span> to review and clear the notification.
          </p>
        </BrandedAlert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Campaigns" value={summaries.length} />
        <MetricCard label="Total assigned" value={totals.assigned} />
        <MetricCard label="Pending" value={totals.pending} hint="Not yet opened" />
        <MetricCard label="Opened" value={totals.opened} hint="In progress" />
        <MetricCard label="Completed" value={totals.completed} hint={`${responseRate}% response rate`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DonutBreakdown rows={statusChart} title="All campaigns — result mix" />
        <HorizontalBarChart rows={categoryChart} title="Assignments by category" />
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Campaign register")}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{filtered.length} campaigns</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search campaigns…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {summaries.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="info" title="No campaigns yet" showIcon>
              Create your first campaign to assign surveys to targeted panelists by district, constituency, or specific
              people.
              <Link href="/admin/campaigns/create" className="mt-2 inline-block font-semibold text-teal-700 underline">
                Create campaign
              </Link>
            </BrandedAlert>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Assigned</th>
                  <th className="px-4 py-3 text-right">Pending</th>
                  <th className="px-4 py-3 text-right">Opened</th>
                  <th className="px-4 py-3 text-right">Completed</th>
                  <th className="px-4 py-3 text-right">Overdue</th>
                  <th className="px-4 py-3 text-right">Response</th>
                  <th className="px-4 py-3">Targeting</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const isNew = isCampaignAdminNotifiable(row) && unreadSet.has(row.id);
                  return (
                  <tr
                    key={row.id}
                    className={adminNewItemRowClass(isNew, "border-b border-zinc-50 hover:bg-teal-50/30")}
                  >
                    <td className="px-4 py-2.5">
                      <p className="inline-flex flex-wrap items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                        {row.title}
                        {isNew ? <AdminNewBadge label="Completed" /> : null}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatAdminLabel(row.category)}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}>
                        {formatAdminLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.assigned}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.pending}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.opened}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.completed}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.overdue}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.responseRate}%</td>
                    <td className="max-w-[12rem] px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.targetingLabel}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/campaigns/${encodeURIComponent(row.id)}/results`}
                        className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
                      >
                        View results
                      </Link>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
