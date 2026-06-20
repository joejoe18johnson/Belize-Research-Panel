"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AdminDataTable,
  AdminNewBadge,
  AdminStatusPill,
  AdminTableHead,
  AdminTableTh,
  adminNewItemRowClass,
} from "@/components/admin/shared/AdminUi";
import { BrandedPdfActions } from "@/components/shared/BrandedPdfActions";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { PayoutQueueRow } from "@/lib/admin-dashboard-metrics";
import { payoutStatusLabel } from "@/lib/admin-payout-display";
import { formatBz } from "@/lib/reward-redemption";
import type { PayoutProcessAction } from "@/lib/reward-redemption";
import { formatHeadingCase } from "@/lib/sentence-case";

export type PayoutQueueFilter = "new" | "open" | "all";
export type PayoutHistoryFilter = "all" | "fulfilled" | "rejected";

function payoutStatusTone(status: PayoutQueueRow["status"]): "success" | "warning" | "info" | "neutral" {
  if (status === "fulfilled") return "success";
  if (status === "approved") return "info";
  if (status === "pending") return "warning";
  if (status === "rejected") return "neutral";
  return "neutral";
}

function filterQueueRows(rows: PayoutQueueRow[], statusFilter: PayoutQueueFilter): PayoutQueueRow[] {
  if (statusFilter === "new") return rows.filter((row) => row.status === "pending");
  if (statusFilter === "open") return rows.filter((row) => row.status === "pending" || row.status === "approved");
  return rows;
}

function filterHistoryRows(rows: PayoutQueueRow[], statusFilter: PayoutHistoryFilter): PayoutQueueRow[] {
  if (statusFilter === "fulfilled") return rows.filter((row) => row.status === "fulfilled");
  if (statusFilter === "rejected") return rows.filter((row) => row.status === "rejected");
  return rows;
}

function payoutStatementHref(id: string): string {
  return `/api/admin/payouts/${encodeURIComponent(id)}/statement`;
}

function PayoutProcessDialog({
  row,
  busyAction,
  message,
  onClose,
  onProcess,
}: {
  row: PayoutQueueRow;
  busyAction: PayoutProcessAction | "";
  message: string;
  onClose: () => void;
  onProcess: (action: PayoutProcessAction) => void;
}) {
  const canStart = row.status === "pending";
  const canComplete = row.status === "approved";
  const canReject = row.status === "pending" || row.status === "approved";
  const readOnly = row.status === "fulfilled" || row.status === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-700">Payout request</p>
            <h3 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">{row.shortId}</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Submitted {row.formattedDate}</p>
            {readOnly && row.formattedUpdatedDate ? (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                Processed {row.formattedUpdatedDate}
                {row.processedBy ? ` by ${row.processedBy}` : ""}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusPill label={payoutStatusLabel(row.status)} tone={payoutStatusTone(row.status)} />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{row.optionLabel}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatBz(row.amountBz)} · {row.points.toLocaleString()} pts</span>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Payment details</p>
            <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{row.paymentTitle}</p>
            <dl className="mt-2 space-y-1.5">
              {(row.paymentFields.length > 0 ? row.paymentFields : row.paymentLines.map((line) => {
                const split = line.indexOf(": ");
                if (split === -1) return { label: "Detail", value: line };
                return { label: line.slice(0, split), value: line.slice(split + 2) };
              })).map((field) => (
                <div key={`${row.id}-${field.label}`}>
                  <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{field.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-all">{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {row.panelistNotes ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">Panelist notes</p>
              <p className="mt-1 text-sm text-amber-950">{row.panelistNotes}</p>
            </div>
          ) : null}
        </div>

        {message ? (
          <div className="mt-4">
            <BrandedAlert
              tone={message.toLowerCase().includes("failed") || message.toLowerCase().includes("could not") ? "error" : "success"}
              compact
              showIcon
            >
              {message}
            </BrandedAlert>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {canStart ? (
            <button
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => onProcess("start")}
              className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {busyAction === "start" ? "Completing request…" : "Complete Request"}
            </button>
          ) : null}
          {canComplete ? (
            <button
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => onProcess("complete")}
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {busyAction === "complete" ? "Completing…" : "Mark complete"}
            </button>
          ) : null}
          {canReject ? (
            <button
              type="button"
              disabled={Boolean(busyAction)}
              onClick={() => onProcess("reject")}
              className="rounded-xl border border-red-200 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {busyAction === "reject" ? "Declining…" : "Decline request"}
            </button>
          ) : null}
          {readOnly ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">This request is closed. No further action is required.</p>
          ) : null}
          <div className="mt-2">
            <BrandedPdfActions viewHref={payoutStatementHref(row.id)} compact viewLabel="View statement" />
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
          When you update this request, the panelist is notified in their dashboard and by email or WhatsApp when contact details are on file.
        </p>
      </div>
    </div>
  );
}

export function AdminPayoutQueueSection({
  rows,
  title,
  description,
  defaultStatusFilter = "all",
  showStatusFilter = true,
  emptyTitle = "Queue clear",
  emptyMessage = "No redemption requests on file.",
  unreadPayoutIds = [],
  mode = "queue",
  sectionId,
}: {
  rows: PayoutQueueRow[];
  title: string;
  description: string;
  defaultStatusFilter?: PayoutQueueFilter | PayoutHistoryFilter;
  showStatusFilter?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  unreadPayoutIds?: string[];
  mode?: "queue" | "history";
  sectionId?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [queueStatusFilter, setQueueStatusFilter] = useState<PayoutQueueFilter>(
    mode === "queue" ? (defaultStatusFilter as PayoutQueueFilter) ?? "all" : "all"
  );
  const [historyStatusFilter, setHistoryStatusFilter] = useState<PayoutHistoryFilter>(
    mode === "history" ? (defaultStatusFilter as PayoutHistoryFilter) ?? "all" : "all"
  );
  const [activeRow, setActiveRow] = useState<PayoutQueueRow | null>(null);
  const [busyAction, setBusyAction] = useState<PayoutProcessAction | "">("");
  const [dialogMessage, setDialogMessage] = useState("");
  const unreadSet = useMemo(() => new Set(unreadPayoutIds), [unreadPayoutIds]);

  const statusFiltered = useMemo(() => {
    if (mode === "history") return filterHistoryRows(rows, historyStatusFilter);
    return filterQueueRows(rows, queueStatusFilter);
  }, [rows, mode, queueStatusFilter, historyStatusFilter]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return statusFiltered;
    return statusFiltered.filter(
      (row) =>
        row.email.toLowerCase().includes(query) ||
        row.optionLabel.toLowerCase().includes(query) ||
        row.shortId.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        row.paymentTitle.toLowerCase().includes(query) ||
        (row.processedBy ?? "").toLowerCase().includes(query)
    );
  }, [statusFiltered, search]);

  const pagination = useTablePagination(filtered);
  const newCount = rows.filter((row) => row.status === "pending").length;
  const openCount = rows.filter((row) => row.status === "pending" || row.status === "approved").length;
  const fulfilledCount = rows.filter((row) => row.status === "fulfilled").length;
  const rejectedCount = rows.filter((row) => row.status === "rejected").length;
  const unreadNewCount = rows.filter((row) => row.status === "pending" && unreadSet.has(row.id)).length;

  const markPayoutRead = async (id: string) => {
    if (!unreadSet.has(id)) return;
    await fetch("/api/admin/read-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "payouts", ids: [id] }),
    });
    router.refresh();
  };

  const processRequest = async (row: PayoutQueueRow, action: PayoutProcessAction) => {
    setBusyAction(action);
    setDialogMessage("");

    try {
      const res = await fetch("/api/admin/payouts/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: row.id, action }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setDialogMessage(data.message ?? "Could not update payout request.");
        return;
      }

      const actionLabel =
        action === "start" ? "Processing started" : action === "complete" ? "Payout marked complete" : "Request declined";
      setDialogMessage(`${actionLabel}. The panelist has been notified.`);
      router.refresh();
      setActiveRow(null);
    } catch {
      setDialogMessage("Network error while updating payout request.");
    } finally {
      setBusyAction("");
    }
  };

  return (
    <section
      id={sectionId}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatHeadingCase(title)}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{description}</p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={mode === "history" ? "Search ID, email, option, processor…" : "Search ID, option, payment…"}
          className="w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        />
      </div>

      {showStatusFilter ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {mode === "history"
            ? (
                [
                  { id: "all" as const, label: `All (${rows.length})` },
                  { id: "fulfilled" as const, label: `Completed (${fulfilledCount})` },
                  { id: "rejected" as const, label: `Declined (${rejectedCount})` },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHistoryStatusFilter(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    historyStatusFilter === item.id
                      ? "bg-teal-700 text-white"
                      : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                  }`}
                >
                  {item.label}
                </button>
              ))
            : (
                [
                  { id: "new" as const, label: `New requests (${newCount})` },
                  { id: "open" as const, label: `Open (${openCount})` },
                  { id: "all" as const, label: `All (${rows.length})` },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQueueStatusFilter(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    queueStatusFilter === item.id
                      ? "bg-teal-700 text-white"
                      : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                  }`}
                >
                  {item.label}
                </button>
              ))}
        </div>
      ) : null}

      {unreadNewCount > 0 ? (
        <div className="mt-4">
          <BrandedAlert tone="success" compact showIcon>
            {unreadNewCount} new payout request{unreadNewCount === 1 ? "" : "s"} highlighted in green below.
          </BrandedAlert>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-4">
          <BrandedAlert tone="success" title={emptyTitle} showIcon>
            {emptyMessage}
          </BrandedAlert>
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
            <AdminDataTable className="min-w-[960px]">
              <AdminTableHead>
                <AdminTableTh>Request ID</AdminTableTh>
                {mode === "history" ? <AdminTableTh>Panelist email</AdminTableTh> : null}
                <AdminTableTh>Status</AdminTableTh>
                <AdminTableTh>Redemption option</AdminTableTh>
                <AdminTableTh align="right">Amount</AdminTableTh>
                <AdminTableTh>Payment details</AdminTableTh>
                <AdminTableTh>{mode === "history" ? "Submitted" : "Date"}</AdminTableTh>
                {mode === "history" ? <AdminTableTh>Processed</AdminTableTh> : null}
                {mode === "history" ? <AdminTableTh>Processed by</AdminTableTh> : null}
                <AdminTableTh align="center">Statement</AdminTableTh>
                <AdminTableTh align="center">Action</AdminTableTh>
              </AdminTableHead>
              <tbody>
                {pagination.paginatedRows.map((row) => {
                  const isNew = row.status === "pending" && unreadSet.has(row.id);
                  return (
                  <tr key={row.id} className={adminNewItemRowClass(isNew, "border-b border-zinc-50 align-top hover:bg-zinc-50/60")}>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      <span className="inline-flex items-center gap-2">
                        {row.shortId}
                        {isNew ? <AdminNewBadge /> : null}
                      </span>
                    </td>
                    {mode === "history" ? (
                      <td className="max-w-[12rem] truncate px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.email}</td>
                    ) : null}
                    <td className="px-4 py-3">
                      <AdminStatusPill label={payoutStatusLabel(row.status)} tone={payoutStatusTone(row.status)} />
                    </td>
                    <td className="max-w-[14rem] px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.optionLabel}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-200">{formatBz(row.amountBz)}</td>
                    <td className="max-w-[14rem] px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">{row.paymentTitle}</p>
                      {row.paymentLines.map((line) => (
                        <p key={`${row.id}-${line}`} className="mt-0.5">
                          {line}
                        </p>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.formattedDate}</td>
                    {mode === "history" ? (
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.formattedUpdatedDate}</td>
                    ) : null}
                    {mode === "history" ? (
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.processedBy ?? "—"}</td>
                    ) : null}
                    <td className="px-4 py-3 text-center">
                      <BrandedPdfActions viewHref={payoutStatementHref(row.id)} compact />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setDialogMessage("");
                          setActiveRow(row);
                          if (row.status === "pending") {
                            void markPayoutRead(row.id);
                          }
                        }}
                        className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
                      >
                        {row.status === "pending" || row.status === "approved" ? "Process" : "View"}
                      </button>
                    </td>
                  </tr>
                  );
                })}
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

      {activeRow ? (
        <PayoutProcessDialog
          row={activeRow}
          busyAction={busyAction}
          message={dialogMessage}
          onClose={() => {
            if (!busyAction) setActiveRow(null);
          }}
          onProcess={(action) => processRequest(activeRow, action)}
        />
      ) : null}
    </section>
  );
}
