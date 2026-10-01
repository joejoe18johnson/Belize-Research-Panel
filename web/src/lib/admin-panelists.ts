import { normalizeDobForComparison } from "./dob";
import { cleanText, normalizePhoneForComparison } from "./validation";
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
  query?: string;
}

/** Match a panelist by name, username, email, or phone. */
export function panelistMatchesAdminSearch(row: PanelistRow, query: string): boolean {
  const needle = cleanText(query).toLowerCase();
  if (!needle) return true;

  const haystack = [
    row.first_name,
    row.last_name,
    `${row.first_name ?? ""} ${row.last_name ?? ""}`,
    row.username,
    row.email,
    row.phone_whatsapp,
  ]
    .map((value) => cleanText(value).toLowerCase())
    .join(" ");

  if (haystack.includes(needle)) return true;

  const phoneNeedle = needle.replace(/\D/g, "");
  if (phoneNeedle.length >= 3) {
    return normalizePhoneForComparison(row.phone_whatsapp ?? "").includes(phoneNeedle);
  }

  return false;
}

export type AdminPanelistPublicRow = PanelistRow & {
  duplicate_name_dob_flag?: boolean;
};

export const FLAGGED_VERIFICATION_STATUS = "Possible Duplicate" as const;

export function isFlaggedPanelist(row: PanelistRow | AdminPanelistPublicRow): boolean {
  return cleanText(row.verification_status) === FLAGGED_VERIFICATION_STATUS;
}

export function getFlaggedPanelists(rows: PanelistRow[]): PanelistRow[] {
  return rows.filter(isFlaggedPanelist);
}

const SENSITIVE_COLUMNS = ["password_salt", "password_hash"] as const;

function normalizeNamePart(value: string): string {
  return cleanText(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function duplicateNameDobKey(row: PanelistRow): string {
  const first = normalizeNamePart(row.first_name ?? "");
  const last = normalizeNamePart(row.last_name ?? "");
  const dob = normalizeDobForComparison(cleanText(row.dob));
  if (!first || !last || !dob) return "";
  return `${first}|${last}|${dob}`;
}

export function buildDuplicateNameDobKeyCounts(rows: PanelistRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function isDuplicateNameDobMatch(row: PanelistRow, keyCounts: Map<string, number>): boolean {
  const key = duplicateNameDobKey(row);
  if (!key) return false;
  return (keyCounts.get(key) ?? 0) > 1;
}

export function countDuplicateNameDob(rows: PanelistRow[]): number {
  const counts = buildDuplicateNameDobKeyCounts(rows);
  let total = 0;
  counts.forEach((count) => {
    if (count > 1) total += count;
  });
  return total;
}

export function getAdminPanelOverview(rows: PanelistRow[]): AdminPanelOverview {
  const markedPossibleDuplicate = rows.filter(isFlaggedPanelist).length;

  return {
    total: rows.length,
    verified: rows.filter((row) => cleanText(row.verification_status) === "Verified").length,
    pending: rows.filter((row) => cleanText(row.verification_status) === "Pending").length,
    duplicateWarnings: markedPossibleDuplicate,
  };
}

export function enrichRowsWithDuplicateFlags(
  rows: PanelistRow[],
  keyCounts: Map<string, number> = buildDuplicateNameDobKeyCounts(rows)
): AdminPanelistPublicRow[] {
  return rows.map((row) => {
    const publicRow: AdminPanelistPublicRow = { ...row };
    for (const col of SENSITIVE_COLUMNS) {
      delete publicRow[col];
    }
    publicRow.duplicate_name_dob_flag = isDuplicateNameDobMatch(row, keyCounts);
    return publicRow;
  });
}

export function getDuplicateReviewRows(rows: PanelistRow[]): AdminPanelistPublicRow[] {
  return groupDuplicateReviewClusters(rows).flatMap((cluster) => cluster.records);
}

export interface DuplicateRelationshipLink {
  id: string;
  label: string;
  detail: string;
  tone: "match" | "warning" | "info";
}

export interface DuplicateReviewCluster {
  id: string;
  key: string;
  displayName: string;
  dob: string;
  records: AdminPanelistPublicRow[];
  relationships: DuplicateRelationshipLink[];
}

function uniqueNormalized(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function allEqual(values: string[]): boolean {
  const unique = uniqueNormalized(values);
  return unique.length === 1 && unique[0].length > 0;
}

function anyOverlap(values: string[]): boolean {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}

function describeDuplicateClusterRelationships(records: AdminPanelistPublicRow[]): DuplicateRelationshipLink[] {
  const links: DuplicateRelationshipLink[] = [
    {
      id: "name-dob",
      label: "Name + date of birth",
      detail: `${records.length} records share the same first name, last name, and exact date of birth.`,
      tone: "match",
    },
  ];

  const emails = records.map((row) => cleanText(row.email).toLowerCase()).filter(Boolean);
  const phones = records.map((row) => normalizePhoneForComparison(row.phone_whatsapp)).filter(Boolean);
  const photoIds = records
    .map((row) => {
      const type = cleanText(row.photo_id_type).toLowerCase();
      const last4 = cleanText(row.photo_id_last4);
      return type && last4 ? `${type}:${last4}` : "";
    })
    .filter(Boolean);
  const districts = records.map((row) => cleanText(row.district).toLowerCase()).filter(Boolean);
  const cities = records.map((row) => cleanText(row.city_town_village).toLowerCase()).filter(Boolean);
  const usernames = records.map((row) => cleanText(row.username).toLowerCase()).filter(Boolean);

  if (allEqual(emails)) {
    links.push({
      id: "same-email",
      label: "Same email",
      detail: "Every record in this cluster uses the same email address — strong sign of duplicate registration.",
      tone: "match",
    });
  } else if (anyOverlap(emails)) {
    links.push({
      id: "shared-email",
      label: "Shared email",
      detail: "At least two records share an email address within this cluster.",
      tone: "warning",
    });
  } else if (emails.length > 1) {
    links.push({
      id: "different-emails",
      label: "Different emails",
      detail: "Each record has a different email — may indicate repeat sign-up under the same identity.",
      tone: "info",
    });
  }

  if (allEqual(phones)) {
    links.push({
      id: "same-phone",
      label: "Same phone",
      detail: "All records share the same phone or WhatsApp number.",
      tone: "match",
    });
  } else if (anyOverlap(phones)) {
    links.push({
      id: "shared-phone",
      label: "Shared phone",
      detail: "At least two records share a phone or WhatsApp number.",
      tone: "warning",
    });
  } else if (phones.length > 1) {
    links.push({
      id: "different-phones",
      label: "Different phones",
      detail: "Each record uses a different phone number.",
      tone: "info",
    });
  }

  if (allEqual(photoIds)) {
    links.push({
      id: "same-photo-id",
      label: "Same photo ID",
      detail: "Matching government ID type and last four digits across records.",
      tone: "match",
    });
  }

  if (allEqual(usernames)) {
    links.push({
      id: "same-username",
      label: "Same username",
      detail: "Records share the same panel username.",
      tone: "match",
    });
  }

  if (allEqual(districts) && allEqual(cities)) {
    links.push({
      id: "same-location",
      label: "Same location",
      detail: "Records list the same district and city or town.",
      tone: "info",
    });
  }

  return links;
}

export function groupDuplicateReviewClusters(rows: PanelistRow[]): DuplicateReviewCluster[] {
  const keyCounts = buildDuplicateNameDobKeyCounts(rows);
  const duplicateRows = enrichRowsWithDuplicateFlags(
    rows.filter((row) => isDuplicateNameDobMatch(row, keyCounts)),
    keyCounts
  );

  const byKey = new Map<string, AdminPanelistPublicRow[]>();
  for (const row of duplicateRows) {
    const key = duplicateNameDobKey(row);
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }

  const clusters: DuplicateReviewCluster[] = [];
  for (const [key, clusterRows] of byKey.entries()) {
    const records = [...clusterRows].sort((a, b) =>
      cleanText(a.registration_date).localeCompare(cleanText(b.registration_date))
    );
    const first = records[0];
    const displayName = `${cleanText(first.first_name)} ${cleanText(first.last_name)}`.trim();
    const dob = cleanText(first.dob);

    clusters.push({
      id: key,
      key,
      displayName,
      dob,
      records,
      relationships: describeDuplicateClusterRelationships(records),
    });
  }

  return clusters.sort((a, b) => {
    const byName = a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
    if (byName !== 0) return byName;
    return a.dob.localeCompare(b.dob);
  });
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
  if (cleanText(filters.query)) {
    filtered = filtered.filter((row) => panelistMatchesAdminSearch(row, filters.query ?? ""));
  }

  const keyCounts = buildDuplicateNameDobKeyCounts(rows);
  return enrichRowsWithDuplicateFlags(filtered, keyCounts);
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

const BELIZE_TIME_ZONE = "America/Belize";
const TIMESTAMP_SORT_KEYS = new Set(["account_opened_at", "registration_date"]);

/** Parse an account-opened or registration value into epoch ms. Belize local when the string has no zone. */
export function parsePanelistTimestamp(value: string): number | null {
  const raw = cleanText(value);
  if (!raw) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw) || raw.includes("T")) {
    const ms = Date.parse(raw);
    return Number.isNaN(ms) ? null : ms;
  }

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    const year = dmy[3];
    const hour = (dmy[4] ?? "0").padStart(2, "0");
    const minute = (dmy[5] ?? "0").padStart(2, "0");
    const ms = Date.parse(`${year}-${month}-${day}T${hour}:${minute}:00-06:00`);
    return Number.isNaN(ms) ? null : ms;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const ms = Date.parse(`${raw}T00:00:00-06:00`);
    return Number.isNaN(ms) ? null : ms;
  }

  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? null : ms;
}

/** Date and time in Belize, for example 30/09/2026 16:39. Date-only values stay date-only. */
export function formatAccountOpenedAt(value: string): string {
  const raw = cleanText(value);
  if (!raw) return "—";
  const ms = parsePanelistTimestamp(raw);
  if (ms == null) return raw;

  const hasTime = /T\d{2}:\d{2}|[ T]\d{1,2}:\d{2}/.test(raw);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BELIZE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}),
  }).formatToParts(new Date(ms));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const date = `${part("day")}/${part("month")}/${part("year")}`;
  if (!hasTime) return date;
  return `${date} ${part("hour")}:${part("minute")}`;
}

export function sortPanelistRows<T extends PanelistRow>(
  rows: T[],
  key: string,
  direction: "asc" | "desc",
  valueOf: (row: T, key: string) => string = (row, sortKey) => row[sortKey] ?? ""
): T[] {
  const factor = direction === "asc" ? 1 : -1;
  const byTime = TIMESTAMP_SORT_KEYS.has(key);

  return [...rows].sort((a, b) => {
    if (byTime) {
      const aTime = parsePanelistTimestamp(valueOf(a, key));
      const bTime = parsePanelistTimestamp(valueOf(b, key));
      if (aTime == null && bTime == null) return 0;
      if (aTime == null) return 1;
      if (bTime == null) return -1;
      return factor * (aTime - bTime);
    }

    const aValue = cleanText(valueOf(a, key)).toLowerCase();
    const bValue = cleanText(valueOf(b, key)).toLowerCase();
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    return factor * aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" });
  });
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
