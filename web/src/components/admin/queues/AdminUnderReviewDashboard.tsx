"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { RequirementStatusGroup } from "@/components/admin/shared/RequirementStatusBadges";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { UnderReviewRow } from "@/lib/admin-dashboard-metrics";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminUnderReviewDashboard({ rows }: { rows: UnderReviewRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.verificationStatus.toLowerCase().includes(query) ||
        row.reason.toLowerCase().includes(query)
    );
  }, [rows, search]);

  const incompleteRequirements = rows.filter(
    (row) =>
      row.emailRequirement !== "approved" ||
      row.phoneRequirement !== "approved" ||
      row.photoIdRequirement !== "approved"
  ).length;
  const pending = rows.filter((row) => row.verificationStatus === "Pending").length;
  const flagged = rows.filter((row) => row.verificationStatus === "Possible Duplicate").length;
  const onHold = rows.filter((row) => row.accountStatus === "on_hold").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Panel review"
        title="Under review"
        description="Panelists with incomplete email, phone, or photo ID requirements, plus flagged, pending, or on-hold accounts."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total in queue" value={rows.length} />
        <MetricCard label="Requirements incomplete" value={incompleteRequirements} hint="Email, phone, or ID" />
        <MetricCard label="Flagged" value={flagged} />
        <MetricCard label="Accounts on hold" value={onHold} />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Review queue")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{filtered.length} records</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, status…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="success" title="Queue clear" showIcon>
              No panelists currently require review.
            </BrandedAlert>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Email · Phone · ID</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.email} className="border-b border-zinc-50 hover:bg-teal-50/30">
                    <td className="px-4 py-2.5 font-medium text-zinc-800">{row.name}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{row.email}</td>
                    <td className="px-4 py-2.5">
                      <RequirementStatusGroup
                        email={row.emailRequirement}
                        phone={row.phoneRequirement}
                        photoId={row.photoIdRequirement}
                        compact
                      />
                    </td>
                    <td className="px-4 py-2.5">{row.verificationStatus}</td>
                    <td className="px-4 py-2.5">
                      {row.accountStatus === "on_hold" ? (
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-900">
                          On hold
                        </span>
                      ) : (
                        <span className="text-zinc-500">Active</span>
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-2.5 text-zinc-600">{row.reason}</td>
                    <td className="px-4 py-2.5 tabular-nums text-zinc-600">{row.registrationDate || "—"}</td>
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
