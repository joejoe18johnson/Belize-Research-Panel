"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MetricCard, PageIntro, AdminNewBadge, adminNewItemRowClass } from "@/components/admin/shared/AdminUi";
import { AdminMarkReadButton } from "@/components/admin/shared/AdminMarkReadButton";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { NotificationQueueRow } from "@/lib/admin-dashboard-metrics";
import { formatHeadingCase } from "@/lib/sentence-case";

function matchesNotificationType(row: NotificationQueueRow, typeFilter: string | null): boolean {
  if (!typeFilter) return true;
  const normalized = typeFilter.trim().toLowerCase();
  if (normalized === "phone") return row.type === "Phone change";
  if (normalized === "email") return row.type === "Email change";
  if (normalized === "verification") return row.type === "Email verification";
  return row.type.toLowerCase().includes(normalized);
}

export function AdminNotificationsDashboard({
  rows,
  unreadIds = [],
}: {
  rows: NotificationQueueRow[];
  unreadIds?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const [search, setSearch] = useState("");
  const [approvingKey, setApprovingKey] = useState("");
  const [message, setMessage] = useState("");
  const unreadSet = useMemo(() => new Set(unreadIds), [unreadIds]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesNotificationType(row, typeFilter)) return false;
      if (!query) return true;
      return (
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.type.toLowerCase().includes(query) ||
        row.detail.toLowerCase().includes(query)
      );
    });
  }, [rows, search, typeFilter]);

  const pagination = useTablePagination(filtered);

  const emailChanges = rows.filter((row) => row.type === "Email change").length;
  const phoneChanges = rows.filter((row) => row.type === "Phone change").length;
  const emailVerification = rows.filter((row) => row.type === "Email verification").length;
  const newCount = rows.filter((row) => unreadSet.has(row.id)).length;

  const markNotificationRead = async (id: string) => {
    if (!unreadSet.has(id)) return;
    await fetch("/api/admin/read-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "notifications", ids: [id] }),
    });
    router.refresh();
  };

  const approveChange = async (row: NotificationQueueRow) => {
    const key = row.id;
    setApprovingKey(key);
    setMessage("");

    const endpoint =
      row.type === "Email change"
        ? "/api/admin/approve-email-change"
        : row.type === "Phone change"
          ? "/api/admin/approve-phone-change"
          : null;

    if (!endpoint) return;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: row.email }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(data.message ?? "Approval failed.");
        return;
      }
      setMessage(`${row.type} approved for ${row.email}.`);
      router.refresh();
    } catch {
      setMessage("Network error while approving change.");
    } finally {
      setApprovingKey("");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Admin action queue"
        title="Notifications"
        description="Contact change approvals and signup email verification backlog requiring administrator attention."
        action={<AdminMarkReadButton scope="notifications" />}
      />

      {typeFilter ? (
        <BrandedAlert tone="info" compact showIcon>
          Showing {typeFilter === "phone" ? "phone change" : typeFilter} notifications.{" "}
          <Link href="/admin/notifications" className="font-semibold underline">
            Show all notifications
          </Link>
        </BrandedAlert>
      ) : null}

      {newCount > 0 ? (
        <BrandedAlert tone="success" compact showIcon>
          {newCount} new notification{newCount === 1 ? "" : "s"} highlighted in green below.
        </BrandedAlert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total pending" value={rows.length} />
        <MetricCard label="Email changes" value={emailChanges} />
        <MetricCard label="Phone changes" value={phoneChanges} />
        <MetricCard label="Email verification" value={emailVerification} />
      </div>

      {message ? (
        <BrandedAlert tone={message.toLowerCase().includes("failed") || message.toLowerCase().includes("error") ? "error" : "success"} showIcon>
          {message}
        </BrandedAlert>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Notification queue")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{filtered.length} items</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, type…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="success" title="Queue clear" showIcon>
              No pending notifications or contact approvals.
            </BrandedAlert>
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
              <table className="min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Detail</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedRows.map((row) => {
                  const actionKey = row.id;
                  const canApprove = row.type === "Email change" || row.type === "Phone change";
                  const isNew = unreadSet.has(row.id);
                  return (
                    <tr
                      key={actionKey}
                      className={adminNewItemRowClass(isNew, "border-b border-zinc-50 hover:bg-teal-50/30")}
                    >
                      <td className="px-4 py-2.5 font-medium text-zinc-800">
                        <span className="inline-flex items-center gap-2">
                          {row.type}
                          {isNew ? <AdminNewBadge /> : null}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{row.name}</td>
                      <td className="px-4 py-2.5 text-zinc-700">{row.email}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{row.detail}</td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-600">{row.requestedAt}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {canApprove ? (
                            <button
                              type="button"
                              disabled={approvingKey === actionKey}
                              onClick={() => approveChange(row)}
                              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                            >
                              {approvingKey === actionKey ? "Approving…" : "Approve"}
                            </button>
                          ) : null}
                          <Link
                            href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                            onClick={() => void markNotificationRead(row.id)}
                          >
                            Open record
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
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
