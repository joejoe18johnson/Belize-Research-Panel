"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DonutBreakdown } from "@/components/admin/analytics/AnalyticsCharts";
import { AdminDeleteConfirmDialog } from "@/components/admin/shared/AdminDeleteConfirmDialog";
import { FilterMultiSelect, MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { buildAdminDeleteCode, extractYearFromDate } from "@/lib/admin-delete-confirmation";
import {
  filterFraudRows,
  filterSuspiciousEmailRows,
  type FraudDuplicateRow,
  type FraudPreventionDetail,
  type SuspiciousEmailRow,
} from "@/lib/admin-fraud";
import { formatHeadingCase } from "@/lib/sentence-case";

type Tab = "overview" | "suspicious-emails" | "email" | "phone" | "name-dob";

type SortKey = keyof Pick<
  FraudDuplicateRow,
  "firstName" | "lastName" | "email" | "phone" | "verificationStatus" | "district"
>;

function DuplicateTable({
  rows,
  sortKey,
  sortDirection,
  onSort,
}: {
  rows: FraudDuplicateRow[];
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const sorted = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => factor * String(a[sortKey]).localeCompare(String(b[sortKey])));
  }, [rows, sortKey, sortDirection]);

  const indicator = (key: SortKey) =>
    sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "";

  const headers: [SortKey, string][] = [
    ["lastName", "Name"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["verificationStatus", "Verification"],
    ["district", "District"],
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
            {headers.map(([key, label]) => (
              <th key={key} className="px-3 py-3">
                <button type="button" onClick={() => onSort(key)} className="font-semibold hover:text-teal-800 dark:text-teal-200">
                  {label}
                  {indicator(key)}
                </button>
              </th>
            ))}
            <th className="px-3 py-3">DOB</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                No duplicate records for this category.
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={`${row.duplicateType}:${row.email}:${row.phone}`} className="border-b border-zinc-50 hover:bg-teal-50/30">
                <td className="px-3 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                  {row.firstName} {row.lastName}
                </td>
                <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300">{row.email}</td>
                <td className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300">{row.phone || "—"}</td>
                <td className="px-3 py-2.5">{row.verificationStatus}</td>
                <td className="px-3 py-2.5">{row.district || "—"}</td>
                <td className="px-3 py-2.5 tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.dob || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function RiskBadge({ level }: { level: SuspiciousEmailRow["riskLevel"] }) {
  const className =
    level === "high"
      ? "bg-red-100 text-red-900"
      : "bg-amber-100 text-amber-950";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${className}`}>
      {level}
    </span>
  );
}

function SuspiciousEmailTable({
  rows,
  flaggingEmail,
  deletingEmail,
  onFlag,
  onDelete,
}: {
  rows: SuspiciousEmailRow[];
  flaggingEmail: string;
  deletingEmail: string;
  onFlag: (email: string) => void;
  onDelete: (row: SuspiciousEmailRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
            <th className="px-3 py-3">Risk</th>
            <th className="px-3 py-3">Name</th>
            <th className="px-3 py-3">Email</th>
            <th className="px-3 py-3">Domain</th>
            <th className="px-3 py-3">Signals</th>
            <th className="px-3 py-3">Verification</th>
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                No suspicious-looking emails matched the current filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const busy = flaggingEmail === row.email || deletingEmail === row.email;
              return (
                <tr key={row.email} className="border-b border-zinc-50 align-top hover:bg-amber-50/30">
                  <td className="px-3 py-3">
                    <RiskBadge level={row.riskLevel} />
                    <p className="mt-1 text-xs tabular-nums text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Score {row.riskScore}</p>
                  </td>
                  <td className="px-3 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                    {row.firstName} {row.lastName}
                  </td>
                  <td className="px-3 py-3 text-zinc-700 dark:text-zinc-300">{row.email}</td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.domain}</td>
                  <td className="max-w-xs px-3 py-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                    <ul className="space-y-1">
                      {row.signals.map((signal) => (
                        <li key={signal.id}>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{signal.label}:</span> {signal.detail}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.verificationStatus || "—"}
                    {row.flagged ? (
                      <p className="mt-1 text-[11px] font-semibold text-amber-800">Already flagged</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100 hover:underline"
                      >
                        Open record
                      </Link>
                      <button
                        type="button"
                        disabled={busy || row.flagged}
                        onClick={() => onFlag(row.email)}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                      >
                        {flaggingEmail === row.email ? "Flagging…" : "Flag"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onDelete(row)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingEmail === row.email ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function AdminFraudPreventionDashboard({ detail }: { detail: FraudPreventionDetail }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [verificationStatuses, setVerificationStatuses] = useState<string[]>([]);
  const [riskLevels, setRiskLevels] = useState<Array<"medium" | "high">>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [flaggingEmail, setFlaggingEmail] = useState("");
  const [deletingEmail, setDeletingEmail] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SuspiciousEmailRow | null>(null);

  const verificationOptions = useMemo(
    () => detail.verificationSummary.map((row) => row.status),
    [detail.verificationSummary]
  );

  const filteredSuspicious = useMemo(
    () => filterSuspiciousEmailRows(detail.suspiciousEmailRows, search, verificationStatuses, riskLevels),
    [detail.suspiciousEmailRows, search, verificationStatuses, riskLevels]
  );
  const filteredEmail = useMemo(
    () => filterFraudRows(detail.emailDuplicateRows, search, verificationStatuses),
    [detail.emailDuplicateRows, search, verificationStatuses]
  );
  const filteredPhone = useMemo(
    () => filterFraudRows(detail.phoneDuplicateRows, search, verificationStatuses),
    [detail.phoneDuplicateRows, search, verificationStatuses]
  );
  const filteredNameDob = useMemo(
    () => filterFraudRows(detail.nameDobDuplicateRows, search, verificationStatuses),
    [detail.nameDobDuplicateRows, search, verificationStatuses]
  );

  const verificationChart = detail.verificationSummary.map((row) => ({
    label: row.status,
    count: row.count,
    percent: row.percent,
  }));

  const markDuplicates = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/panelists/mark-duplicates", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      setMessage(data.message ?? (res.ok ? "Done." : "Action failed."));
      if (res.ok) router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const flagRecord = async (email: string) => {
    setFlaggingEmail(email);
    setActionMessage("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "Possible Duplicate" }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setActionMessage(data.message ?? "Could not flag record.");
        return;
      }
      setActionMessage(`Flagged ${email} as Possible Duplicate.`);
      router.refresh();
    } catch {
      setActionMessage("Network error while flagging record.");
    } finally {
      setFlaggingEmail("");
    }
  };

  const confirmDelete = async (confirmCode: string) => {
    if (!deleteTarget) return;
    setDeletingEmail(deleteTarget.email);
    setActionMessage("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(deleteTarget.email)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setActionMessage(data.message ?? "Could not delete record.");
        return;
      }
      setDeleteTarget(null);
      setActionMessage(`Deleted ${deleteTarget.email}.`);
      router.refresh();
    } catch {
      setActionMessage("Network error while deleting record.");
    } finally {
      setDeletingEmail("");
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "overview", label: "Overview", count: 0 },
    { id: "suspicious-emails", label: "Suspicious emails", count: detail.suspiciousEmails },
    { id: "email", label: "Duplicate emails", count: detail.emailDuplicateRows.length },
    { id: "phone", label: "Duplicate phones", count: detail.phoneDuplicateRows.length },
    { id: "name-dob", label: "Name + DOB", count: detail.nameDobDuplicateRows.length },
  ];

  const activeRows =
    tab === "email"
      ? filteredEmail
      : tab === "phone"
        ? filteredPhone
        : tab === "name-dob"
          ? filteredNameDob
          : [];

  const deleteConfirmCode = deleteTarget
    ? buildAdminDeleteCode(deleteTarget.firstName, extractYearFromDate(deleteTarget.registrationDate))
    : "";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Panel quality"
        title={formatHeadingCase("Fraud prevention")}
        description="Duplicate detection, suspicious email screening, verification breakdowns, and admin quality actions."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Suspicious emails" value={detail.suspiciousEmails} />
        <MetricCard label="Duplicate emails" value={detail.duplicateEmails} />
        <MetricCard label="Duplicate phones" value={detail.duplicatePhones} />
        <MetricCard label="Same name + DOB" value={detail.duplicateNameDob} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting || detail.duplicateNameDob === 0}
          onClick={markDuplicates}
          className="inline-flex min-h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {submitting ? "Updating…" : "Mark name + DOB duplicates as Possible Duplicate"}
        </button>
        <Link
          href="/admin/panelists?tab=flagged"
          className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
        >
          Open flagged panelists
        </Link>
      </div>
      {message ? <p className="text-sm text-teal-900 dark:text-teal-100">{message}</p> : null}
      {actionMessage ? <p className="text-sm text-teal-900 dark:text-teal-100">{actionMessage}</p> : null}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "border border-b-0 border-teal-200 bg-white dark:bg-zinc-900 text-teal-900 dark:text-teal-100"
                : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:bg-teal-50/50 hover:text-teal-800 dark:text-teal-200"
            }`}
          >
            {item.label}
            {item.count > 0 ? ` (${item.count})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <DonutBreakdown rows={verificationChart} title="Verification status" />
      ) : tab === "suspicious-emails" ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Suspicious emails")}</h2>
            <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              Flags disposable providers, bot-like local parts, random aliases, and addresses that do not match the
              panelist name. New signups with high-risk patterns are blocked automatically. Review, flag, or delete as
              needed.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_280px_220px]">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Search</label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, domain, signal…"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <FilterMultiSelect
              label="Verification"
              options={verificationOptions}
              selected={verificationStatuses}
              onChange={setVerificationStatuses}
            />
            <FilterMultiSelect
              label="Risk level"
              options={["high", "medium"]}
              selected={riskLevels}
              onChange={(values) => setRiskLevels(values as Array<"medium" | "high">)}
            />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            Showing <strong>{filteredSuspicious.length}</strong> suspicious email
            {filteredSuspicious.length === 1 ? "" : "s"}
          </p>
          <SuspiciousEmailTable
            rows={filteredSuspicious}
            flaggingEmail={flaggingEmail}
            deletingEmail={deletingEmail}
            onFlag={flagRecord}
            onDelete={setDeleteTarget}
          />
        </section>
      ) : (
        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Search</label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, phone, username…"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <FilterMultiSelect
              label="Verification"
              options={verificationOptions}
              selected={verificationStatuses}
              onChange={setVerificationStatuses}
            />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            Showing <strong>{activeRows.length}</strong> rows
          </p>
          <DuplicateTable
            rows={activeRows}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={toggleSort}
          />
        </section>
      )}

      <AdminDeleteConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Delete ${deleteTarget.firstName} ${deleteTarget.lastName}`.trim() : "Delete record"}
        description={
          deleteTarget
            ? `This permanently removes the panelist record for ${deleteTarget.email} and related account data.`
            : ""
        }
        confirmCode={deleteConfirmCode}
        loading={Boolean(deletingEmail)}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
