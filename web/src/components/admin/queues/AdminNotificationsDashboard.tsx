"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { NotificationQueueRow } from "@/lib/admin-dashboard-metrics";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminNotificationsDashboard({ rows }: { rows: NotificationQueueRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [approvingKey, setApprovingKey] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.type.toLowerCase().includes(query) ||
        row.detail.toLowerCase().includes(query)
    );
  }, [rows, search]);

  const emailChanges = rows.filter((row) => row.type === "Email change").length;
  const phoneChanges = rows.filter((row) => row.type === "Phone change").length;
  const emailVerification = rows.filter((row) => row.type === "Email verification").length;

  const approveChange = async (row: NotificationQueueRow) => {
    const key = `${row.type}:${row.email}`;
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
      />

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
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
            <table className="min-w-full text-left text-sm">
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
                {filtered.map((row) => {
                  const actionKey = `${row.type}:${row.email}`;
                  const canApprove = row.type === "Email change" || row.type === "Phone change";
                  return (
                    <tr key={actionKey} className="border-b border-zinc-50 hover:bg-teal-50/30">
                      <td className="px-4 py-2.5 font-medium text-zinc-800">{row.type}</td>
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
        )}
      </section>
    </div>
  );
}
