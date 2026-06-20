import {
  applySampleFilters,
  EMPTY_SAMPLE_FILTERS,
  panelistToSampleRow,
  type SampleFilters,
} from "./admin-sample-selection";
import type { PanelistGroup } from "./panelist-group-types";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(String(item))).filter(Boolean);
}

export function normalizeSampleFilters(value: unknown): SampleFilters {
  if (!value || typeof value !== "object") return { ...EMPTY_SAMPLE_FILTERS };
  const input = value as Record<string, unknown>;
  const ageMin = Number(input.ageMin);
  const ageMax = Number(input.ageMax);

  return {
    residence: normalizeStringArray(input.residence),
    districts: normalizeStringArray(input.districts),
    cities: normalizeStringArray(input.cities),
    constituencies: normalizeStringArray(input.constituencies),
    ctvAreas: normalizeStringArray(input.ctvAreas),
    countriesAbroad: normalizeStringArray(input.countriesAbroad),
    sexes: normalizeStringArray(input.sexes),
    ageGroups: normalizeStringArray(input.ageGroups),
    ethnicities: normalizeStringArray(input.ethnicities),
    educations: normalizeStringArray(input.educations),
    verificationStatuses: normalizeStringArray(input.verificationStatuses),
    registeredVotersOnly: Boolean(input.registeredVotersOnly),
    ageMin: Number.isFinite(ageMin) ? ageMin : EMPTY_SAMPLE_FILTERS.ageMin,
    ageMax: Number.isFinite(ageMax) ? ageMax : EMPTY_SAMPLE_FILTERS.ageMax,
  };
}

export function normalizePanelistGroupEmails(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => cleanText(String(item)).toLowerCase()).filter(Boolean))];
  }
  return [
    ...new Set(
      String(value ?? "")
        .split(/[\n,;]+/)
        .map((item) => cleanText(item).toLowerCase())
        .filter(Boolean)
    ),
  ];
}

export function resolvePanelistGroupMembers(panelists: PanelistRow[], group: PanelistGroup): PanelistRow[] {
  if (group.type === "static") {
    const emails = new Set(normalizePanelistGroupEmails(group.emails ?? []));
    return panelists.filter((row) => emails.has(cleanText(row.email).toLowerCase()));
  }

  const filters = normalizeSampleFilters(group.filters);
  const sampleRows = panelists.map(panelistToSampleRow);
  const matchedEmails = new Set(applySampleFilters(sampleRows, filters).map((row) => row.email.toLowerCase()));
  return panelists.filter((row) => matchedEmails.has(cleanText(row.email).toLowerCase()));
}

export function countPanelistGroupMembers(panelists: PanelistRow[], group: PanelistGroup): number {
  return resolvePanelistGroupMembers(panelists, group).length;
}

export function panelistGroupSummary(group: PanelistGroup, memberCount: number): string {
  if (group.type === "static") {
    return `${memberCount} panelist${memberCount === 1 ? "" : "s"} (saved list)`;
  }
  return `${memberCount} panelist${memberCount === 1 ? "" : "s"} (filter rules)`;
}
