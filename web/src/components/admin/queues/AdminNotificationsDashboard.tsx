"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { MetricCard, PageIntro, AdminNewBadge, adminNewItemRowClass, adminTableRowHoverClass } from "@/components/admin/shared/AdminUi";
import { AdminMarkReadButton } from "@/components/admin/shared/AdminMarkReadButton";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { AdminAlertGuide } from "@/components/admin/queues/AdminAlertGuide";
import type { NotificationQueueRow } from "@/lib/admin-dashboard-metrics";
import { notificationQueueGuideFor, type AdminAlertScope } from "@/lib/admin-notification-guide";
import { formatHeadingCase } from "@/lib/sentence-case";

function matchesNotificationType(row: NotificationQueueRow, typeFilter: string | null): boolean {
  if (!typeFilter) return true;
  const normalized = typeFilter.trim().toLowerCase();
  if (normalized === "phone") return row.type === "Phone change";
  if (normalized === "email") return row.type === "Email change";
  if (normalized === "duplicate") return row.type === "Duplicate review";
  if (normalized === "verification") return row.type === "Email verification";
  if (normalized === "panelist" || normalized === "review" || normalized === "under-review") {
    return row.type === "Panelist verification";
  }
  return row.type.toLowerCase().includes(normalized);
}

export function AdminNotificationsDashboard({
  rows,
  unreadIds = [],
  scopeCounts = {},
  demoLoopEnabled = false,
}: {
  rows: NotificationQueueRow[];
  unreadIds?: string[];
  scopeCounts?: Partial<Record<AdminAlertScope, number>>;
  demoLoopEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get("type");
  const [search, setSearch] = useState("");
  const [actingKey, setActingKey] = useState("");
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
  const duplicateReviews = rows.filter((row) => row.type === "Duplicate review").length;
  const emailVerification = rows.filter((row) => row.type === "Email verification").length;
  const panelistVerification = rows.filter((row) => row.type === "Panelist verification").length;
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

  const decideChange = async (row: NotificationQueueRow, decision: "approve" | "deny") => {
    const key = `${row.id}:${decision}`;
    setActingKey(key);
    setMessage("");

    const endpoint =
      row.type === "Email change"
        ? decision === "approve"
          ? "/api/admin/approve-email-change"
          : "/api/admin/deny-email-change"
        : row.type === "Phone change"
          ? decision === "approve"
            ? "/api/admin/approve-phone-change"
            : "/api/admin/deny-phone-change"
          : row.type === "Duplicate review" && decision === "approve"
            ? "/api/admin/release-fraud-review"
            : null;

    if (!endpoint) return;

    if (decision === "deny") {
      const confirmed = window.confirm(
        row.type === "Email change"
          ? `Deny the email change for ${row.email}? They will keep their current email and the account will be reactivated if nothing else is pending.`
          : `Deny the phone change for ${row.email}? They will keep their current number and the account will be reactivated if nothing else is pending.`
      );
      if (!confirmed) {
        setActingKey("");
        return;
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: row.email }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setMessage(data.message ?? (decision === "approve" ? "Approval failed." : "Could not deny this request."));
        return;
      }
      setMessage(
        decision === "approve"
          ? `${row.type} approved for ${row.email}.`
          : `${row.type} denied for ${row.email}.`
      );
      router.refresh();
    } catch {
      setMessage(
        decision === "approve"
          ? "Network error while approving change."
          : "Network error while denying change."
      );
    } finally {
      setActingKey("");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Admin action queue"
        title="Notifications"
        description="Contact change approvals and denials, duplicate-review holds, signup email confirmation, and new panelists waiting for administrator verification."
        action={<AdminMarkReadButton scope="notifications" />}
      />

      {typeFilter ? (
        <BrandedAlert tone="info" compact showIcon>
          Showing{" "}
          {typeFilter === "phone"
            ? "phone change"
            : typeFilter === "duplicate"
              ? "duplicate review"
              : typeFilter === "panelist" || typeFilter === "review"
              ? "panelist verification"
              : typeFilter}{" "}
          notifications.{" "}
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

      <AdminAlertGuide scopeCounts={scopeCounts} demoLoopEnabled={demoLoopEnabled} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total pending" value={rows.length} href="/admin/notifications" active={!typeFilter} />
        <MetricCard
          label="Email changes"
          value={emailChanges}
          href="/admin/notifications?type=email"
          active={typeFilter === "email"}
        />
        <MetricCard
          label="Phone changes"
          value={phoneChanges}
          href="/admin/notifications?type=phone"
          active={typeFilter === "phone"}
        />
        <MetricCard
          label="Duplicate review"
          value={duplicateReviews}
          href="/admin/notifications?type=duplicate"
          active={typeFilter === "duplicate"}
        />
        <MetricCard
          label="Email verification"
          value={emailVerification}
          href="/admin/notifications?type=verification"
          active={typeFilter === "verification"}
        />
        <MetricCard
          label="Panelist verification"
          value={panelistVerification}
          hint="Also on Under Review"
          href="/admin/notifications?type=panelist"
          active={typeFilter === "panelist" || typeFilter === "review"}
        />
      </div>

      {message ? (
        <BrandedAlert tone={message.toLowerCase().includes("failed") || message.toLowerCase().includes("error") ? "error" : "success"} showIcon>
          {message}
        </BrandedAlert>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Notification queue")}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{filtered.length} items</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, type…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="success" title="Queue clear" showIcon>
              No pending notifications, contact approvals, or panelist verification items.
            </BrandedAlert>
          </div>
        ) : (
          <>
            <div className="mt-4 table-scroll rounded-xl border border-zinc-100 dark:border-zinc-800">
              <table className="min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Detail</th>
                    <th className="px-4 py-3">Where shown</th>
                    <th className="px-4 py-3">Marked read</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagination.paginatedRows.map((row) => {
                  const actionKey = row.id;
                  const canDecideContact = row.type === "Email change" || row.type === "Phone change";
                  const canReleaseHold = row.type === "Duplicate review";
                  const isNew = unreadSet.has(row.id);
                  const guide = notificationQueueGuideFor(row.type);
                  return (
                    <tr
                      key={actionKey}
                      className={adminNewItemRowClass(isNew, adminTableRowHoverClass)}
                    >
                      <td className="px-4 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                        <span className="inline-flex items-center gap-2">
                          {row.type}
                          {isNew ? <AdminNewBadge /> : null}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{row.name}</td>
                      <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">{row.email}</td>
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.detail}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                        <p>{guide.whereShown}</p>
                        <p className="mt-1 text-zinc-500 dark:text-zinc-500">{guide.navBadge}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">{guide.markedReadWhen}</td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.requestedAt}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {canDecideContact ? (
                            <>
                              <button
                                type="button"
                                disabled={Boolean(actingKey)}
                                onClick={() => decideChange(row, "approve")}
                                className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                              >
                                {actingKey === `${row.id}:approve` ? "Approving…" : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(actingKey)}
                                onClick={() => decideChange(row, "deny")}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
                              >
                                {actingKey === `${row.id}:deny` ? "Denying…" : "Deny"}
                              </button>
                            </>
                          ) : null}
                          {canReleaseHold ? (
                            <button
                              type="button"
                              disabled={Boolean(actingKey)}
                              onClick={() => decideChange(row, "approve")}
                              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                            >
                              {actingKey === `${row.id}:approve` ? "Releasing…" : "Release hold"}
                            </button>
                          ) : null}
                          <Link
                            href={
                              row.type === "Panelist verification"
                                ? "/admin/under-review?queue=pending"
                                : `/admin/panelists?email=${encodeURIComponent(row.email)}`
                            }
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
                            onClick={() => {
                              if (row.type === "Panelist verification") return;
                              void markNotificationRead(row.id);
                            }}
                          >
                            {row.type === "Panelist verification" ? "Open Under Review" : "Open record"}
                          </Link>
                          {row.type === "Panelist verification" ? (
                            <Link
                              href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                              className="text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
                              onClick={() => void markNotificationRead(row.id)}
                            >
                              Open record
                            </Link>
                          ) : null}
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
