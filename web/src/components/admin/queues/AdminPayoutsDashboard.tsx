"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { PayoutQueueRow } from "@/lib/admin-dashboard-metrics";
import { formatBz } from "@/lib/reward-redemption";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminPayoutsDashboard({ rows }: { rows: PayoutQueueRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.optionLabel.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query)
    );
  }, [rows, search]);

  const pending = rows.filter((row) => row.status === "pending").length;
  const approved = rows.filter((row) => row.status === "approved").length;
  const totalPoints = rows.reduce((sum, row) => sum + row.points, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Rewards fulfillment"
        title="Payouts"
        description="Redemption requests awaiting review or fulfillment. Approved requests still need payout processing."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open requests" value={rows.length} />
        <MetricCard label="Pending review" value={pending} />
        <MetricCard label="Approved" value={approved} hint="Awaiting fulfillment" />
        <MetricCard label="Points reserved" value={totalPoints.toLocaleString()} />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Payout queue")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{filtered.length} requests</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, option…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="success" title="Queue clear" showIcon>
              No pending or approved redemption requests.
            </BrandedAlert>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Panelist</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Option</th>
                  <th className="px-4 py-3 text-right">Points</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-50 hover:bg-teal-50/30">
                    <td className="px-4 py-2.5 font-medium text-zinc-800">{row.name}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{row.email}</td>
                    <td className="px-4 py-2.5">{row.optionLabel}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.points.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatBz(row.amountBz)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.status === "pending"
                            ? "bg-teal-100 text-teal-900"
                            : "bg-teal-700 text-white"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-zinc-600">{row.submittedAt}</td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                        className="font-semibold text-teal-700 hover:text-teal-900"
                      >
                        Open record
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
