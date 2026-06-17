"use client";

import { useMemo, useState } from "react";
import { AdminDataModuleDashboard } from "@/components/admin/AdminDataModuleDashboard";
import { SiteSelect, mapStringOptions } from "@/components/shared/SiteSelect";
import type { DistributionExportRow } from "@/lib/admin-module-snapshots";
import type { AdminModuleSnapshot } from "@/lib/admin-snapshot-types";

const MODES = ["Email", "WhatsApp", "SMS", "Facebook Messenger", "Other"] as const;

function rowsToCsv(rows: DistributionExportRow[]): string {
  const headers = [
    "distribution_id",
    "survey_title",
    "first_name",
    "last_name",
    "phone_whatsapp",
    "email",
    "facebook",
    "instagram",
    "tiktok",
    "district",
    "constituency",
    "survey_url",
    "distribution_mode",
  ];
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  return [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.distributionId,
        row.surveyTitle,
        row.firstName,
        row.lastName,
        row.phone,
        row.email,
        row.facebook,
        row.instagram,
        row.tiktok,
        row.district,
        row.constituency,
        row.surveyUrl,
        row.mode,
      ]
        .map((value) => escape(String(value)))
        .join(",")
    ),
  ].join("\n");
}

export function AdminDistributionEngineDashboard({
  snapshot,
  exportRows,
}: {
  snapshot: AdminModuleSnapshot;
  exportRows: DistributionExportRow[];
}) {
  const [mode, setMode] = useState<(typeof MODES)[number]>("Email");
  const [surveyFilter, setSurveyFilter] = useState("");

  const surveyOptions = useMemo(
    () => [...new Set(exportRows.map((row) => row.surveyTitle))].sort(),
    [exportRows]
  );

  const filtered = useMemo(() => {
    const rows = exportRows.map((row) => ({ ...row, mode }));
    if (!surveyFilter) return rows;
    return rows.filter((row) => row.surveyTitle === surveyFilter);
  }, [exportRows, mode, surveyFilter]);

  const download = () => {
    const csv = rowsToCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `distribution-export-${mode.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AdminDataModuleDashboard snapshot={snapshot} />
      <section className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">Prepare distribution export</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Select mode and study, then download the contact CSV for manual sending or gateway import.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Distribution mode</label>
            <SiteSelect
              value={mode}
              onChange={(value) => setMode(value as (typeof MODES)[number])}
              options={mapStringOptions(MODES)}
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Survey assignment</label>
            <SiteSelect
              value={surveyFilter}
              onChange={setSurveyFilter}
              placeholder="All active assignments"
              options={[
                { value: "", label: "All active assignments" },
                ...mapStringOptions(surveyOptions),
              ]}
              className="mt-1.5"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={download}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              Export {filtered.length} contacts (CSV)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
