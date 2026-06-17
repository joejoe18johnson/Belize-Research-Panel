import { cleanText } from "./validation";
import type { PanelistRow } from "./panelists";

export interface AdminPanelOverview {
  total: number;
  verified: number;
  pending: number;
  duplicateWarnings: number;
}

export interface AdminPanelistFilters {
  verification?: string[];
  district?: string[];
  constituency?: string[];
  voterStatus?: string[];
}

export type AdminPanelistPublicRow = PanelistRow & {
  duplicate_name_dob_flag?: boolean;
};

const SENSITIVE_COLUMNS = ["password_salt", "password_hash"] as const;

function normalizeNamePart(value: string): string {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function duplicateNameDobKey(row: PanelistRow): string {
  return `${normalizeNamePart(row.first_name ?? "")}|${normalizeNamePart(row.last_name ?? "")}|${cleanText(row.dob)}`;
}

export function countDuplicateNameDob(rows: PanelistRow[]): number {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key.replace(/\|/g, "").trim()) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let total = 0;
  counts.forEach((count) => {
    if (count > 1) total += count;
  });
  return total;
}

export function getAdminPanelOverview(rows: PanelistRow[]): AdminPanelOverview {
  const duplicateByNameDob = countDuplicateNameDob(rows);
  const markedPossibleDuplicate = rows.filter(
    (row) => cleanText(row.verification_status) === "Possible Duplicate"
  ).length;

  return {
    total: rows.length,
    verified: rows.filter((row) => cleanText(row.verification_status) === "Verified").length,
    pending: rows.filter((row) => cleanText(row.verification_status) === "Pending").length,
    duplicateWarnings: Math.max(duplicateByNameDob, markedPossibleDuplicate),
  };
}

export function getDuplicateReviewRows(rows: PanelistRow[]): PanelistRow[] {
  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key.replace(/\|/g, "").trim()) continue;
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  return rows.filter((row) => (keyCounts.get(duplicateNameDobKey(row)) ?? 0) > 1);
}

export function applyAdminPanelistFilters(
  rows: PanelistRow[],
  filters: AdminPanelistFilters
): AdminPanelistPublicRow[] {
  let filtered = [...rows];

  if (filters.verification?.length) {
    filtered = filtered.filter((row) => filters.verification!.includes(cleanText(row.verification_status)));
  }
  if (filters.district?.length) {
    filtered = filtered.filter((row) => filters.district!.includes(cleanText(row.district)));
  }
  if (filters.constituency?.length) {
    filtered = filtered.filter((row) => filters.constituency!.includes(cleanText(row.constituency)));
  }
  if (filters.voterStatus?.length) {
    filtered = filtered.filter((row) => filters.voterStatus!.includes(cleanText(row.voter_status)));
  }

  const duplicateKeys = new Set<string>();
  const keyCounts = new Map<string, number>();
  for (const row of filtered) {
    const key = duplicateNameDobKey(row);
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }
  keyCounts.forEach((count, key) => {
    if (count > 1 && key.replace(/\|/g, "").trim()) duplicateKeys.add(key);
  });

  return filtered.map((row) => {
    const publicRow: AdminPanelistPublicRow = { ...row };
    for (const col of SENSITIVE_COLUMNS) {
      delete publicRow[col];
    }
    publicRow.duplicate_name_dob_flag = duplicateKeys.has(duplicateNameDobKey(row));
    return publicRow;
  });
}

export function countPanelistsByField(
  rows: PanelistRow[],
  field: keyof PanelistRow,
  options: string[]
): Record<string, number> {
  const counts = Object.fromEntries(options.map((option) => [option, 0])) as Record<string, number>;
  for (const row of rows) {
    const value = cleanText(row[field]);
    if (value in counts) counts[value] += 1;
  }
  return counts;
}

export function getUniqueFilterValues(rows: PanelistRow[], field: keyof PanelistRow): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const value = cleanText(row[field]);
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function panelistDisplayLabel(row: PanelistRow): string {
  return `${cleanText(row.first_name)} ${cleanText(row.last_name)} | ${cleanText(row.username)} | ${cleanText(row.registration_date)}`;
}

export function panelistsToCsv(rows: PanelistRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]).filter(
    (key) => !SENSITIVE_COLUMNS.includes(key as (typeof SENSITIVE_COLUMNS)[number])
  );
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(cleanText(row[header]))).join(",")),
  ];
  return lines.join("\n");
}
