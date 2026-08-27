"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageIntro, AdminTableScroll, adminNewItemRowClass, adminResponsiveTableClass, AdminTableRow, AdminTableTd } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
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
  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyNotice, setReplyNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [selectedId, setSelectedId] = useState(initialMessages[0]?.id ?? "");

  const filtered = useMemo(() => {
    if (filter === "new") return messages.filter((message) => message.status === "new");
    if (filter === "read") return messages.filter((message) => message.status === "read");
    return messages;
  }, [filter, messages]);

  const pagination = useTablePagination(filtered, 20);
  const pageRows = pagination.paginatedRows;
  const selected = messages.find((message) => message.id === selectedId) ?? pageRows[0] ?? null;
  const selectedReplies = selected?.replies ?? [];

  const updateMessage = (next: SupportMessageRecord) => {
    setMessages((current) => current.map((message) => (message.id === next.id ? next : message)));
  };

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch("/api/admin/support-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "read" }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: SupportMessageRecord };
      if (res.ok && data.message) updateMessage(data.message);
      router.refresh();
    } finally {
      setMarkingId("");
    }
  };

  const sendReply = async (id: string) => {
    const body = replyBody.trim();
    if (body.length < 10) {
      setReplyNotice({ tone: "error", text: "Please write a slightly longer reply (at least 10 characters)." });
      return;
    }

    setReplyBusy(true);
    setReplyNotice(null);
    try {
      const res = await fetch("/api/admin/support-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reply", reply: body }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: SupportMessageRecord | string;
        warning?: string;
      };
      if (!res.ok) {
        setReplyNotice({
          tone: "error",
          text: typeof data.message === "string" ? data.message : "Could not send the reply.",
        });
        return;
      }
      const updated = data.message && typeof data.message === "object" ? data.message : undefined;
      if (updated) {
        updateMessage(updated);
        setSelectedId(updated.id);
      }
      setReplyBody("");
      if (data.warning) {
        setReplyNotice({ tone: "error", text: data.warning });
      } else {
        setReplyNotice({
          tone: "success",
          text: updated ? `Reply emailed to ${updated.email}.` : "Reply sent.",
        });
      }
      router.refresh();
    } catch {
      setReplyNotice({ tone: "error", text: "Network error while sending the reply." });
    } finally {
      setReplyBusy(false);
    }
  };

  const newCount = messages.filter((message) => message.status === "new").length;

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin console"
        title="Support inbox"
        description="Help requests from signed-in panelists. Reply here to send a branded email to the panelist’s account address."
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
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Help page</p>
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
            <table className={`${adminResponsiveTableClass} w-full text-left text-sm`}>
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
                  <AdminTableRow>
                    <AdminTableTd colSpan={4} empty label="">
                      <span className="text-zinc-500 dark:text-zinc-400">No support messages yet.</span>
                    </AdminTableTd>
                  </AdminTableRow>
                ) : (
                  pageRows.map((row) => {
                    const active = selected?.id === row.id;
                    const replied = (row.replies?.length ?? 0) > 0;
                    return (
                      <AdminTableRow
                        key={row.id}
                        className={`cursor-pointer ${active ? "bg-teal-50 dark:bg-teal-950/30" : adminNewItemRowClass(row.status === "new")}`}
                        onClick={() => {
                          setSelectedId(row.id);
                          setReplyBody("");
                          setReplyNotice(null);
                        }}
                      >
                        <AdminTableTd label="Received">{formatTimestamp(row.createdAt)}</AdminTableTd>
                        <AdminTableTd label="From">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</div>
                          <div className="break-all text-xs text-zinc-500 dark:text-zinc-400">{row.email}</div>
                        </AdminTableTd>
                        <AdminTableTd label="Topic">{row.topicLabel}</AdminTableTd>
                        <AdminTableTd label="Status">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              row.status === "new"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                                : replied
                                  ? "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {row.status === "new" ? "Unread" : replied ? "Replied" : "Read"}
                          </span>
                        </AdminTableTd>
                      </AdminTableRow>
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
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-300">{selected.email}</p>
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
              </dl>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Message</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {selected.message}
                </p>
              </div>

              {selectedReplies.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Replies sent
                  </h3>
                  {selectedReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
                    >
                      <p className="text-xs font-semibold text-teal-800 dark:text-teal-200">
                        {reply.sentBy} · {formatTimestamp(reply.sentAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                        {reply.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <form
                className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendReply(selected.id);
                }}
              >
                <label htmlFor="support-reply" className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Reply by email
                </label>
                <textarea
                  id="support-reply"
                  value={replyBody}
                  onChange={(event) => {
                    setReplyBody(event.target.value);
                    setReplyNotice(null);
                  }}
                  rows={5}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 transition focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder={`Write a reply. This branded email will be sent to ${selected.email}.`}
                />
                {replyNotice ? (
                  <BrandedAlert tone={replyNotice.tone} compact showIcon>
                    {replyNotice.text}
                  </BrandedAlert>
                ) : null}
                <button
                  type="submit"
                  disabled={replyBusy}
                  className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {replyBusy ? "Sending reply…" : "Send reply email"}
                </button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Select a message to read the full details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
