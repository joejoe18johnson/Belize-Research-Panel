"use client";

import Link from "next/link";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import type { CampaignSummary } from "@/lib/campaign-targeting";
import { statusPillClass } from "@/lib/theme-surfaces";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

function statusClass(status: CampaignSummary["status"]): string {
  if (status === "active") return statusPillClass.active;
  if (status === "closed") return statusPillClass.closed;
  return statusPillClass.warning;
}

export function ClientCampaignsDashboard({
  organizationName,
  campaigns,
}: {
  organizationName: string;
  campaigns: CampaignSummary[];
}) {
  const activeCount = campaigns.filter((row) => row.status === "active").length;
  const completedTotal = campaigns.reduce((sum, row) => sum + row.completed, 0);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Client research portal"
        title={organizationName}
        description="Studies commissioned by your organization through the Belize Research Panel. Only campaigns assigned to your account appear here."
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Commissioned studies" value={campaigns.length} hint="Campaigns linked to your account" />
        <MetricCard label="Active fieldwork" value={activeCount} hint="Currently in the field" />
        <MetricCard label="Total completions" value={completedTotal} hint="Across all studies" />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Your commissioned studies")}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Only campaigns linked to your client account are shown. Open a study to view response rates, sample composition, and question-level distributions.
            </p>
        </div>
        {campaigns.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No commissioned studies are linked to your account yet. Your Belize Research Panel project manager will assign campaigns when fieldwork opens.
          </p>
        ) : (
          <div className="table-scroll">
            <table className="min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                  <th className="px-5 py-3">Study</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Assigned</th>
                  <th className="px-5 py-3 text-right">Completed</th>
                  <th className="px-5 py-3 text-right">Response rate</th>
                  <th className="px-5 py-3">Field period</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-50 hover:bg-teal-50/30 dark:border-zinc-800/80 dark:hover:bg-teal-950/30 dark:border-zinc-800/80">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{row.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{formatAdminLabel(row.category)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(row.status)}`}>
                        {formatAdminLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{row.assigned}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{row.completed}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-teal-800 dark:text-teal-200">
                      {row.responseRate}%
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      {row.assignedDate} → {row.completeByDate}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/client/campaigns/${encodeURIComponent(row.id)}/results`}
                        className="inline-flex min-h-9 items-center rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800"
                      >
                        {formatHeadingCase("View results")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
