"use client";

import { useMemo, useState } from "react";
import { AdminDataModuleDashboard } from "@/components/admin/AdminDataModuleDashboard";
import type { PanelMatchIndex } from "@/lib/admin-module-snapshots";
import type { AdminModuleSnapshot } from "@/lib/admin-snapshot-types";
import { cleanText } from "@/lib/validation";

type MatchResult = {
  row: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  constituency: string;
  matchType: string;
  panelEmail: string;
};

function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  });
}

function normalizeHeader(value: string): string {
  return cleanText(value).toLowerCase().replace(/[\s_-]+/g, "");
}

function pickColumn(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const index = normalized.indexOf(alias);
    if (index >= 0) return index;
  }
  return -1;
}

export function AdminExternalDataImportDashboard({
  snapshot,
  matchIndex,
}: {
  snapshot: AdminModuleSnapshot;
  matchIndex: PanelMatchIndex;
}) {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState<{ total: number; matched: number; unmatched: number } | null>(null);
  const [error, setError] = useState("");

  const emailSet = useMemo(() => new Set(matchIndex.emails), [matchIndex.emails]);
  const phoneSet = useMemo(() => new Set(matchIndex.phones.map((phone) => phone.replace(/\D/g, ""))), [matchIndex.phones]);
  const nameDobSet = useMemo(() => new Set(matchIndex.nameDobKeys), [matchIndex.nameDobKeys]);

  const onFile = async (file: File | null) => {
    setError("");
    setResults([]);
    setSummary(null);
    if (!file) return;

    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setError("CSV must include a header row and at least one data row.");
        return;
      }

      const headers = rows[0];
      const emailCol = pickColumn(headers, ["email", "emailaddress"]);
      const phoneCol = pickColumn(headers, ["phone", "phonewhatsapp", "phonewhatsapp", "mobile"]);
      const firstCol = pickColumn(headers, ["firstname", "first"]);
      const lastCol = pickColumn(headers, ["lastname", "last", "surname"]);
      const dobCol = pickColumn(headers, ["dob", "dateofbirth", "birthdate"]);
      const constituencyCol = pickColumn(headers, ["constituency"]);

      const matched: MatchResult[] = [];
      let unmatched = 0;

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        const email = emailCol >= 0 ? cleanText(row[emailCol]).toLowerCase() : "";
        const phone = phoneCol >= 0 ? cleanText(row[phoneCol]).replace(/\D/g, "") : "";
        const firstName = firstCol >= 0 ? cleanText(row[firstCol]) : "";
        const lastName = lastCol >= 0 ? cleanText(row[lastCol]) : "";
        const dob = dobCol >= 0 ? cleanText(row[dobCol]) : "";
        const constituency = constituencyCol >= 0 ? cleanText(row[constituencyCol]) : "";
        const nameDobKey = `${firstName.toLowerCase()}|${lastName.toLowerCase()}|${dob}`;

        let matchType = "";
        let panelEmail = "";
        if (email && emailSet.has(email)) {
          matchType = "Email";
          panelEmail = email;
        } else if (phone && phoneSet.has(phone)) {
          matchType = "Phone";
          panelEmail = matchIndex.emails.find((e) => e) ?? "";
        } else if (nameDobKey.replace(/\|/g, "") && nameDobSet.has(nameDobKey)) {
          matchType = "Name + DOB";
        }

        if (matchType) {
          matched.push({ row: i + 1, firstName, lastName, email, phone, dob, constituency, matchType, panelEmail });
        } else {
          unmatched += 1;
        }
      }

      setResults(matched);
      setSummary({ total: rows.length - 1, matched: matched.length, unmatched });
    } catch {
      setError("Could not parse CSV file.");
    }
  };

  return (
    <div className="space-y-6">
      <AdminDataModuleDashboard snapshot={snapshot} />
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">Import & match external CSV</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Upload a voter roll, census extract, or client list. Rows are matched against the live panel by email, phone, or name + DOB.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="mt-4 block w-full text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800"
        />
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {summary ? (
          <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
            Processed <strong>{summary.total}</strong> rows — <strong>{summary.matched}</strong> matched,{" "}
            <strong>{summary.unmatched}</strong> unmatched.
          </p>
        ) : null}
        {results.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                  <th className="px-3 py-3">Row</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Match type</th>
                  <th className="px-3 py-3">Constituency</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 100).map((result) => (
                  <tr key={result.row} className="border-b border-zinc-50 hover:bg-teal-50/30">
                    <td className="px-3 py-2.5 tabular-nums">{result.row}</td>
                    <td className="px-3 py-2.5">
                      {result.firstName} {result.lastName}
                    </td>
                    <td className="px-3 py-2.5">{result.email || "—"}</td>
                    <td className="px-3 py-2.5">{result.matchType}</td>
                    <td className="px-3 py-2.5">{result.constituency || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > 100 ? (
              <p className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Showing first 100 matches.</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
