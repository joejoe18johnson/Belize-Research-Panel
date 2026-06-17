import { duplicateNameDobKey } from "./admin-panelists";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

export interface FraudPreventionStats {
  duplicateEmails: number;
  duplicatePhones: number;
  duplicateNameDob: number;
  verificationSummary: { status: string; count: number }[];
}

export interface PanelAnalyticsStats {
  total: number;
  verified: number;
  pending: number;
  active: number;
  byDistrict: { label: string; count: number }[];
  byConstituency: { label: string; count: number }[];
  registeredVoters: number;
  politicalInterestProfiles: number;
  marketInterestProfiles: number;
  civicInterestProfiles: number;
}

function countFieldDuplicates(rows: PanelistRow[], field: keyof PanelistRow): number {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const value = cleanText(row[field]);
    if (!value) continue;
    seen.set(value.toLowerCase(), (seen.get(value.toLowerCase()) ?? 0) + 1);
  }
  let total = 0;
  seen.forEach((count) => {
    if (count > 1) total += count;
  });
  return total;
}

export function getFraudPreventionStats(rows: PanelistRow[]): FraudPreventionStats {
  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key.replace(/\|/g, "").trim()) continue;
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }
  let duplicateNameDob = 0;
  keyCounts.forEach((count) => {
    if (count > 1) duplicateNameDob += count;
  });

  const verificationMap = new Map<string, number>();
  for (const row of rows) {
    const status = cleanText(row.verification_status) || "Unknown";
    verificationMap.set(status, (verificationMap.get(status) ?? 0) + 1);
  }

  return {
    duplicateEmails: countFieldDuplicates(rows, "email"),
    duplicatePhones: countFieldDuplicates(rows, "phone_whatsapp"),
    duplicateNameDob,
    verificationSummary: [...verificationMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function groupCount(rows: PanelistRow[], field: keyof PanelistRow): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = cleanText(row[field]);
    if (!value) continue;
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function isRegisteredVoter(row: PanelistRow): boolean {
  const voterStatus = cleanText(row.voter_status).toLowerCase();
  const votingStatus = cleanText(row.voting_status).toLowerCase();
  return voterStatus === "registered voter" || votingStatus === "yes";
}

export function getPanelAnalyticsStats(rows: PanelistRow[]): PanelAnalyticsStats {
  return {
    total: rows.length,
    verified: rows.filter((row) => cleanText(row.verification_status) === "Verified").length,
    pending: rows.filter((row) => cleanText(row.verification_status) === "Pending").length,
    active: rows.filter((row) => cleanText(row.status) === "Active").length,
    byDistrict: groupCount(rows, "district"),
    byConstituency: groupCount(rows, "constituency"),
    registeredVoters: rows.filter(isRegisteredVoter).length,
    politicalInterestProfiles: rows.filter((row) => cleanText(row.political_interests)).length,
    marketInterestProfiles: rows.filter((row) => cleanText(row.market_interests)).length,
    civicInterestProfiles: rows.filter((row) => cleanText(row.civic_interests)).length,
  };
}

export function getNameDobDuplicateRowIndices(rows: PanelistRow[]): number[] {
  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key.replace(/\|/g, "").trim()) continue;
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }
  const indices: number[] = [];
  rows.forEach((row, index) => {
    const key = duplicateNameDobKey(row);
    if ((keyCounts.get(key) ?? 0) > 1) indices.push(index);
  });
  return indices;
}
