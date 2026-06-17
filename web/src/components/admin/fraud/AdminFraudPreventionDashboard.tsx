"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DonutBreakdown } from "@/components/admin/analytics/AnalyticsCharts";
import { FilterMultiSelect, MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { filterFraudRows, type FraudDuplicateRow, type FraudPreventionDetail } from "@/lib/admin-fraud";
import { formatHeadingCase } from "@/lib/sentence-case";

type Tab = "overview" | "email" | "phone" | "name-dob";

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
    <div className="overflow-x-auto rounded-xl border border-zinc-100">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
            {headers.map(([key, label]) => (
              <th key={key} className="px-3 py-3">
                <button type="button" onClick={() => onSort(key)} className="font-semibold hover:text-teal-800">
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
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No duplicate records for this category.
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={`${row.duplicateType}:${row.email}:${row.phone}`} className="border-b border-zinc-50 hover:bg-teal-50/30">
                <td className="px-3 py-2.5 font-medium text-zinc-800">
                  {row.firstName} {row.lastName}
                </td>
                <td className="px-3 py-2.5 text-zinc-700">{row.email}</td>
                <td className="px-3 py-2.5 text-zinc-700">{row.phone || "—"}</td>
                <td className="px-3 py-2.5">{row.verificationStatus}</td>
                <td className="px-3 py-2.5">{row.district || "—"}</td>
                <td className="px-3 py-2.5 tabular-nums text-zinc-600">{row.dob || "—"}</td>
              </tr>
            ))
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
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const verificationOptions = useMemo(
    () => detail.verificationSummary.map((row) => row.status),
    [detail.verificationSummary]
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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "overview", label: "Overview", count: 0 },
    { id: "email", label: "Duplicate emails", count: detail.emailDuplicateRows.length },
    { id: "phone", label: "Duplicate phones", count: detail.phoneDuplicateRows.length },
    { id: "name-dob", label: "Name + DOB", count: detail.nameDobDuplicateRows.length },
  ];

  const activeRows =
    tab === "email" ? filteredEmail : tab === "phone" ? filteredPhone : tab === "name-dob" ? filteredNameDob : [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Panel quality"
        title={formatHeadingCase("Fraud prevention")}
        description="Duplicate detection, verification breakdowns, and bulk quality actions — aligned with the Streamlit MVP Fraud Prevention module."
      />

      <div className="grid gap-3 sm:grid-cols-3">
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
          href="/admin/panelists"
          className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
        >
          Open panelists register
        </Link>
      </div>
      {message ? <p className="text-sm text-teal-900">{message}</p> : null}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "border border-b-0 border-teal-200 bg-white text-teal-900"
                : "text-zinc-600 hover:bg-teal-50/50 hover:text-teal-800"
            }`}
          >
            {item.label}
            {item.count > 0 ? ` (${item.count})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <DonutBreakdown rows={verificationChart} title="Verification status" />
      ) : (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Search</label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, phone, username…"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <FilterMultiSelect
              label="Verification"
              options={verificationOptions}
              selected={verificationStatuses}
              onChange={setVerificationStatuses}
            />
          </div>
          <p className="text-sm text-zinc-500">
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
    </div>
  );
}
