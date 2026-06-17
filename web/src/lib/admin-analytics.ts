import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

export interface AnalyticsCountRow {
  label: string;
  count: number;
  percent: number;
}

export interface AnalyticsPanelistSlice {
  district: string;
  constituency: string;
  verificationStatus: string;
  panelistStatus: string;
  voterStatus: string;
  sex: string;
  education: string;
  ethnicity: string;
  age: number | null;
  ageGroup: string;
  isRegisteredVoter: boolean;
  politicalInterests: string[];
  marketInterests: string[];
  civicInterests: string[];
  registeredCtvArea: string;
}

export interface AnalyticsFilters {
  districts: string[];
  constituencies: string[];
  verificationStatuses: string[];
  panelistStatuses: string[];
  voterStatuses: string[];
  sexes: string[];
  registeredVotersOnly: boolean;
}

export const EMPTY_ANALYTICS_FILTERS: AnalyticsFilters = {
  districts: [],
  constituencies: [],
  verificationStatuses: [],
  panelistStatuses: [],
  voterStatuses: [],
  sexes: [],
  registeredVotersOnly: false,
};

export interface AdvancedAnalyticsSnapshot {
  total: number;
  verified: number;
  pending: number;
  active: number;
  registeredVoters: number;
  withPoliticalInterests: number;
  withMarketInterests: number;
  withCivicInterests: number;
  byDistrict: AnalyticsCountRow[];
  byConstituency: AnalyticsCountRow[];
  byVerification: AnalyticsCountRow[];
  byPanelistStatus: AnalyticsCountRow[];
  bySex: AnalyticsCountRow[];
  byEducation: AnalyticsCountRow[];
  byEthnicity: AnalyticsCountRow[];
  byAgeGroup: AnalyticsCountRow[];
  registeredVotersByConstituency: AnalyticsCountRow[];
  registeredVotersByCtv: AnalyticsCountRow[];
  topPoliticalInterests: AnalyticsCountRow[];
  topMarketInterests: AnalyticsCountRow[];
  topCivicInterests: AnalyticsCountRow[];
  filterOptions: {
    districts: string[];
    constituencies: string[];
    verificationStatuses: string[];
    panelistStatuses: string[];
    voterStatuses: string[];
    sexes: string[];
  };
}

function parseInterests(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseAge(value: string): number | null {
  const n = Number.parseInt(cleanText(value), 10);
  return Number.isFinite(n) ? n : null;
}

function ageGroup(age: number | null): string {
  if (age === null) return "Unknown";
  if (age < 25) return "18–24";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  if (age < 55) return "45–54";
  if (age < 65) return "55–64";
  return "65+";
}

function isRegisteredVoterRow(row: PanelistRow): boolean {
  const voterStatus = cleanText(row.voter_status).toLowerCase();
  const votingStatus = cleanText(row.voting_status).toLowerCase();
  return voterStatus === "registered voter" || votingStatus === "yes";
}

export function panelistToAnalyticsSlice(row: PanelistRow): AnalyticsPanelistSlice {
  const age = parseAge(row.age);
  return {
    district: cleanText(row.district),
    constituency: cleanText(row.constituency),
    verificationStatus: cleanText(row.verification_status) || "Unknown",
    panelistStatus: cleanText(row.status) || "Unknown",
    voterStatus: cleanText(row.voter_status) || cleanText(row.voting_status) || "Unknown",
    sex: cleanText(row.sex) || "Unknown",
    education: cleanText(row.education) || "Unknown",
    ethnicity: cleanText(row.ethnicity) || "Unknown",
    age,
    ageGroup: ageGroup(age),
    isRegisteredVoter: isRegisteredVoterRow(row),
    politicalInterests: parseInterests(row.political_interests ?? ""),
    marketInterests: parseInterests(row.market_interests ?? ""),
    civicInterests: parseInterests(row.civic_interests ?? ""),
    registeredCtvArea: cleanText(row.registered_ctv_area),
  };
}

export function applyAnalyticsFilters(
  slices: AnalyticsPanelistSlice[],
  filters: AnalyticsFilters
): AnalyticsPanelistSlice[] {
  return slices.filter((row) => {
    if (filters.districts.length && !filters.districts.includes(row.district)) return false;
    if (filters.constituencies.length && !filters.constituencies.includes(row.constituency)) return false;
    if (filters.verificationStatuses.length && !filters.verificationStatuses.includes(row.verificationStatus)) {
      return false;
    }
    if (filters.panelistStatuses.length && !filters.panelistStatuses.includes(row.panelistStatus)) return false;
    if (filters.voterStatuses.length && !filters.voterStatuses.includes(row.voterStatus)) return false;
    if (filters.sexes.length && !filters.sexes.includes(row.sex)) return false;
    if (filters.registeredVotersOnly && !row.isRegisteredVoter) return false;
    return true;
  });
}

function countByField(rows: AnalyticsPanelistSlice[], pick: (row: AnalyticsPanelistSlice) => string): AnalyticsCountRow[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = pick(row) || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return toCountRows(map, rows.length);
}

function countInterests(rows: AnalyticsPanelistSlice[], field: "politicalInterests" | "marketInterests" | "civicInterests"): AnalyticsCountRow[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row[field]) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  const denom = rows.length || 1;
  return [...map.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / denom) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

function toCountRows(map: Map<string, number>, total: number): AnalyticsCountRow[] {
  const denom = total || 1;
  return [...map.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: Math.round((count / denom) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}

export function buildAdvancedAnalyticsSnapshot(
  slices: AnalyticsPanelistSlice[],
  allSlices: AnalyticsPanelistSlice[]
): AdvancedAnalyticsSnapshot {
  const total = slices.length;
  const registeredOnly = slices.filter((row) => row.isRegisteredVoter);

  return {
    total,
    verified: slices.filter((row) => row.verificationStatus === "Verified").length,
    pending: slices.filter((row) => row.verificationStatus === "Pending").length,
    active: slices.filter((row) => row.panelistStatus === "Active").length,
    registeredVoters: registeredOnly.length,
    withPoliticalInterests: slices.filter((row) => row.politicalInterests.length > 0).length,
    withMarketInterests: slices.filter((row) => row.marketInterests.length > 0).length,
    withCivicInterests: slices.filter((row) => row.civicInterests.length > 0).length,
    byDistrict: countByField(slices, (row) => row.district),
    byConstituency: countByField(slices, (row) => row.constituency),
    byVerification: countByField(slices, (row) => row.verificationStatus),
    byPanelistStatus: countByField(slices, (row) => row.panelistStatus),
    bySex: countByField(slices, (row) => row.sex),
    byEducation: countByField(slices, (row) => row.education),
    byEthnicity: countByField(slices, (row) => row.ethnicity),
    byAgeGroup: countByField(slices, (row) => row.ageGroup),
    registeredVotersByConstituency: countByField(registeredOnly, (row) => row.constituency),
    registeredVotersByCtv: countByField(
      registeredOnly.filter((row) => row.registeredCtvArea),
      (row) => row.registeredCtvArea
    ),
    topPoliticalInterests: countInterests(slices, "politicalInterests"),
    topMarketInterests: countInterests(slices, "marketInterests"),
    topCivicInterests: countInterests(slices, "civicInterests"),
    filterOptions: {
      districts: uniqueSorted(allSlices.map((row) => row.district)),
      constituencies: uniqueSorted(allSlices.map((row) => row.constituency)),
      verificationStatuses: uniqueSorted(allSlices.map((row) => row.verificationStatus)),
      panelistStatuses: uniqueSorted(allSlices.map((row) => row.panelistStatus)),
      voterStatuses: uniqueSorted(allSlices.map((row) => row.voterStatus)),
      sexes: uniqueSorted(allSlices.map((row) => row.sex)),
    },
  };
}

export function sortCountRows(
  rows: AnalyticsCountRow[],
  sortKey: "label" | "count" | "percent",
  direction: "asc" | "desc"
): AnalyticsCountRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sortKey === "label") return factor * a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    return factor * (a[sortKey] - b[sortKey]);
  });
}
