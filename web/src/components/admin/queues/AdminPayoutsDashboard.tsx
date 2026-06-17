"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminDataTable,
  AdminDownloadButton,
  AdminStatusPill,
  AdminTableHead,
  AdminTableTh,
  IconMetricCard,
  PageIntro,
} from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { PayoutQueueRow } from "@/lib/admin-dashboard-metrics";
import { buildPayoutStatementText, payoutStatusLabel } from "@/lib/admin-payout-display";
import { formatBz } from "@/lib/reward-redemption";
import { formatHeadingCase } from "@/lib/sentence-case";

function payoutStatusTone(status: PayoutQueueRow["status"]): "success" | "warning" | "info" | "neutral" {
  if (status === "fulfilled") return "success";
  if (status === "approved") return "info";
  if (status === "pending") return "warning";
  return "neutral";
}

function downloadPayoutStatement(row: PayoutQueueRow) {
  const content = buildPayoutStatementText({
    id: row.id,
    name: row.name,
    email: row.email,
    optionLabel: row.optionLabel,
    amountBz: row.amountBz,
    points: row.points,
    status: row.status,
    submittedAt: row.submittedAt,
    payment: { title: row.paymentTitle, lines: row.paymentLines },
  });
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `payout-${row.shortId}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

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
        row.shortId.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        row.paymentTitle.toLowerCase().includes(query)
    );
  }, [rows, search]);

  const pending = rows.filter((row) => row.status === "pending").length;
  const approved = rows.filter((row) => row.status === "approved").length;
  const completed = rows.filter((row) => row.status === "fulfilled").length;
  const openAmount = rows
    .filter((row) => row.status === "pending" || row.status === "approved")
    .reduce((sum, row) => sum + row.amountBz, 0);

  const pagination = useTablePagination(filtered, 2);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Rewards fulfillment"
        title="Payouts"
        description="Redemption requests awaiting review, approval, or fulfillment."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IconMetricCard label="Open requests" value={pending + approved} tone="amber" icon={<MetricClockIcon />} />
        <IconMetricCard label="Pending review" value={pending} tone="blue" icon={<MetricReviewIcon />} />
        <IconMetricCard
          label="Approved"
          value={approved}
          hint="Awaiting fulfillment"
          tone="green"
          icon={<MetricCheckIcon />}
        />
        <IconMetricCard
          label="Open liability"
          value={formatBz(openAmount)}
          hint={`${completed} completed`}
          tone="violet"
          icon={<MetricCashIcon />}
        />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{formatHeadingCase("Payout queue")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{filtered.length} requests</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ID, name, email, option…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="success" title="Queue clear" showIcon>
              No redemption requests on file.
            </BrandedAlert>
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
              <AdminDataTable className="min-w-[1100px]">
                <AdminTableHead>
                  <AdminTableTh>Request ID</AdminTableTh>
                  <AdminTableTh>Status</AdminTableTh>
                  <AdminTableTh>Redemption option</AdminTableTh>
                  <AdminTableTh align="right">Amount</AdminTableTh>
                  <AdminTableTh>Panelist</AdminTableTh>
                  <AdminTableTh>Payment details</AdminTableTh>
                  <AdminTableTh>Date</AdminTableTh>
                  <AdminTableTh align="center">Invoice / statement</AdminTableTh>
                  <AdminTableTh align="center">Action</AdminTableTh>
                </AdminTableHead>
                <tbody>
                  {pagination.paginatedRows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-50 align-top hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-semibold text-zinc-900">{row.shortId}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill label={payoutStatusLabel(row.status)} tone={payoutStatusTone(row.status)} />
                    </td>
                    <td className="max-w-[14rem] px-4 py-3 font-medium text-zinc-900">{row.optionLabel}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-800">{formatBz(row.amountBz)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{row.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{row.email}</p>
                    </td>
                    <td className="max-w-[12rem] px-4 py-3 text-xs leading-relaxed text-zinc-600">
                      <p className="font-medium text-zinc-800">{row.paymentTitle}</p>
                      {row.paymentLines.map((line) => (
                        <p key={`${row.id}-${line}`} className="mt-0.5">
                          {line}
                        </p>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{row.formattedDate}</td>
                    <td className="px-4 py-3 text-center">
                      <AdminDownloadButton onClick={() => downloadPayoutStatement(row)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.status === "pending" || row.status === "approved" ? (
                        <Link
                          href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                        >
                          Open record
                        </Link>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminDataTable>
          </div>
            <TablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalPages={pagination.totalPages}
              totalRows={pagination.totalRows}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </section>
    </div>
  );
}

function MetricClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function MetricReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625A1.125 1.125 0 0 0 4.5 3.75v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function MetricCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function MetricCashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}
