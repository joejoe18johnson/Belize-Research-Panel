"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FraudPreventionStats } from "@/lib/admin-panel-stats";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

export function FraudPreventionLive({ stats }: { stats: FraudPreventionStats }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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

  return (
    <section className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-teal-950">
        {formatHeadingCase("Live duplicate detection")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Duplicate emails", stats.duplicateEmails],
          ["Duplicate phones", stats.duplicatePhones],
          ["Same name + DOB", stats.duplicateNameDob],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-teal-100 bg-white px-4 py-3">
            <p className="text-xs font-medium text-zinc-600">{label}</p>
            <p className="mt-1 text-2xl font-bold text-teal-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-teal-100 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-800">{formatHeadingCase("Verification status")}</p>
        <ul className="mt-2 space-y-1 text-sm text-zinc-700">
          {stats.verificationSummary.map((row) => (
            <li key={row.status} className="flex justify-between gap-4">
              <span>{formatAdminLabel(row.status)}</span>
              <span className="font-semibold">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting || stats.duplicateNameDob === 0}
          onClick={markDuplicates}
          className="inline-flex min-h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {submitting ? "Updating…" : "Mark name + DOB duplicates as Possible Duplicate"}
        </button>
        <Link
          href="/admin/dashboard"
          className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
        >
          {formatHeadingCase("Open duplicate review table")}
        </Link>
      </div>
      {message ? <p className="text-sm text-teal-900">{message}</p> : null}
    </section>
  );
}
