"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageIntro, AdminTableScroll, adminNewItemRowClass, adminTableRowHoverClass } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import type { SupportMessageRecord } from "@/lib/support-messages";
import { formatHeadingCase } from "@/lib/sentence-case";

function formatTimestamp(value: string): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-BZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AdminSupportInboxClient({
  messages: initialMessages,
}: {
  messages: SupportMessageRecord[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [filter, setFilter] = useState<"all" | "new" | "read">("all");
  const [markingId, setMarkingId] = useState("");
  const [selectedId, setSelectedId] = useState(initialMessages[0]?.id ?? "");

  const filtered = useMemo(() => {
    if (filter === "new") return messages.filter((message) => message.status === "new");
    if (filter === "read") return messages.filter((message) => message.status === "read");
    return messages;
  }, [filter, messages]);

  const pagination = useTablePagination(filtered, 20);
  const pageRows = pagination.paginatedRows;
  const selected = messages.find((message) => message.id === selectedId) ?? pageRows[0] ?? null;

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch("/api/admin/support-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: SupportMessageRecord };
      if (res.ok && data.message) {
        setMessages((current) =>
          current.map((message) => (message.id === id ? data.message! : message))
        );
      }
      router.refresh();
    } finally {
      setMarkingId("");
    }
  };

  const newCount = messages.filter((message) => message.status === "new").length;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin console"
        title="Support inbox"
        description="Help requests submitted from the public help page. Messages are also emailed to the configured support inbox."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{messages.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Unread</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">{newCount}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Public page</p>
          <a href="/help" className="mt-1 inline-block text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300">
            /help
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "new", "read"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === value
                ? "bg-teal-700 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {formatHeadingCase(value === "all" ? "All" : value === "new" ? "Unread" : "Read")}
          </button>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <AdminTableScroll>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                      No support messages yet.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => {
                    const active = selected?.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`cursor-pointer border-b border-zinc-100 dark:border-zinc-800 ${adminTableRowHoverClass} ${
                          active ? "bg-teal-50 dark:bg-teal-950/30" : row.status === "new" ? adminNewItemRowClass : ""
                        }`}
                        onClick={() => setSelectedId(row.id)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                          {formatTimestamp(row.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{row.email}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.topicLabel}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              row.status === "new"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {row.status === "new" ? "Unread" : "Read"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </AdminTableScroll>
          <div className="px-4 pb-4">
            <TablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalPages={pagination.totalPages}
              totalRows={pagination.totalRows}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{selected.name}</h2>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-300"
                  >
                    {selected.email}
                  </a>
                </div>
                {selected.status === "new" ? (
                  <button
                    type="button"
                    disabled={markingId === selected.id}
                    onClick={() => markRead(selected.id)}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {markingId === selected.id ? "Marking…" : "Mark read"}
                  </button>
                ) : null}
              </div>

              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Topic</dt>
                  <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{selected.topicLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Received</dt>
                  <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{formatTimestamp(selected.createdAt)}</dd>
                </div>
                {selected.panelistEmail ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Signed-in panelist
                    </dt>
                    <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{selected.panelistEmail}</dd>
                  </div>
                ) : null}
              </dl>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Message</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {selected.message}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Select a message to read the full details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
