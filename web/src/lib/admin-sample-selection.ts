import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

export const SAMPLING_METHODS = [
  "Simple Random Sample",
  "Stratified Sample",
  "Quota Sample",
  "Controlled Sample",
  "Cluster Sample",
] as const;

export type SamplingMethod = (typeof SAMPLING_METHODS)[number];

export const AGE_GROUPS = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Unknown"] as const;

export interface SamplePanelistRow {
  email: string;
  firstName: string;
  lastName: string;
  placeOfResidence: string;
  district: string;
  cityTownVillage: string;
  countryIfAbroad: string;
  constituency: string;
  registeredCtvArea: string;
  sex: string;
  age: number | null;
  ageGroup: string;
  ethnicity: string;
  education: string;
  verificationStatus: string;
  panelistStatus: string;
  phone: string;
  isRegisteredVoter: boolean;
}

export interface SampleFilters {
  residence: string[];
  districts: string[];
  cities: string[];
  constituencies: string[];
  ctvAreas: string[];
  countriesAbroad: string[];
  sexes: string[];
  ageGroups: string[];
  ethnicities: string[];
  educations: string[];
  verificationStatuses: string[];
  registeredVotersOnly: boolean;
  ageMin: number;
  ageMax: number;
}

export const EMPTY_SAMPLE_FILTERS: SampleFilters = {
  residence: [],
  districts: [],
  cities: [],
  constituencies: [],
  ctvAreas: [],
  countriesAbroad: [],
  sexes: [],
  ageGroups: [],
  ethnicities: [],
  educations: [],
  verificationStatuses: [],
  registeredVotersOnly: false,
  ageMin: 18,
  ageMax: 100,
};

function parseAge(value: string): number | null {
  const n = Number.parseInt(cleanText(value), 10);
  return Number.isFinite(n) ? n : null;
}

function ageGroupFromAge(age: number | null): string {
  if (age === null) return "Unknown";
  if (age < 25) return "18–24";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  if (age < 55) return "45–54";
  if (age < 65) return "55–64";
  return "65+";
}

function isRegisteredVoter(row: PanelistRow): boolean {
  const vs = cleanText(row.voter_status).toLowerCase();
  const voting = cleanText(row.voting_status).toLowerCase();
  return vs === "registered voter" || voting === "yes";
}

export function panelistToSampleRow(row: PanelistRow): SamplePanelistRow {
  const age = parseAge(row.age);
  return {
    email: cleanText(row.email),
    firstName: cleanText(row.first_name),
    lastName: cleanText(row.last_name),
    placeOfResidence: cleanText(row.place_of_residence),
    district: cleanText(row.district),
    cityTownVillage: cleanText(row.city_town_village),
    countryIfAbroad: cleanText(row.country_if_abroad),
    constituency: cleanText(row.constituency),
    registeredCtvArea: cleanText(row.registered_ctv_area),
    sex: cleanText(row.sex) || "Unknown",
    age,
    ageGroup: ageGroupFromAge(age),
    ethnicity: cleanText(row.ethnicity) || "Unknown",
    education: cleanText(row.education) || "Unknown",
    verificationStatus: cleanText(row.verification_status) || "Unknown",
    panelistStatus: cleanText(row.status) || "Unknown",
    phone: cleanText(row.phone_whatsapp),
    isRegisteredVoter: isRegisteredVoter(row),
  };
}

export function applySampleFilters(rows: SamplePanelistRow[], filters: SampleFilters): SamplePanelistRow[] {
  return rows.filter((row) => {
    if (filters.residence.length && !filters.residence.includes(row.placeOfResidence)) return false;
    if (filters.districts.length && !filters.districts.includes(row.district)) return false;
    if (filters.cities.length && !filters.cities.includes(row.cityTownVillage)) return false;
    if (filters.constituencies.length && !filters.constituencies.includes(row.constituency)) return false;
    if (filters.ctvAreas.length && !filters.ctvAreas.includes(row.registeredCtvArea)) return false;
    if (filters.countriesAbroad.length && !filters.countriesAbroad.includes(row.countryIfAbroad)) return false;
    if (filters.sexes.length && !filters.sexes.includes(row.sex)) return false;
    if (filters.ageGroups.length && !filters.ageGroups.includes(row.ageGroup)) return false;
    if (filters.ethnicities.length && !filters.ethnicities.includes(row.ethnicity)) return false;
    if (filters.educations.length && !filters.educations.includes(row.education)) return false;
    if (filters.verificationStatuses.length && !filters.verificationStatuses.includes(row.verificationStatus)) {
      return false;
    }
    if (filters.registeredVotersOnly && !row.isRegisteredVoter) return false;
    if (row.age !== null && (row.age < filters.ageMin || row.age > filters.ageMax)) return false;
    return true;
  });
}

export function sampleFilterOptions(rows: SamplePanelistRow[]) {
  const unique = (pick: (row: SamplePanelistRow) => string) =>
    [...new Set(rows.map(pick).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

  const ages = rows.map((row) => row.age).filter((age): age is number => age !== null);
  const maxAge = ages.length ? Math.max(100, ...ages) : 100;

  return {
    residence: unique((row) => row.placeOfResidence),
    districts: unique((row) => row.district),
    cities: unique((row) => row.cityTownVillage),
    constituencies: unique((row) => row.constituency),
    ctvAreas: unique((row) => row.registeredCtvArea),
    countriesAbroad: unique((row) => row.countryIfAbroad),
    sexes: unique((row) => row.sex),
    ethnicities: unique((row) => row.ethnicity),
    educations: unique((row) => row.education),
    verificationStatuses: unique((row) => row.verificationStatus),
    maxAge,
  };
}

/** MVP sample size formula from appfiles/app.py */
export function calculateSampleSize(
  populationSize: number,
  marginErrorPct: number,
  confidenceLevel: "90%" | "95%" | "99%"
): number {
  const zValues: Record<string, number> = { "90%": 1.645, "95%": 1.96, "99%": 2.576 };
  const z = zValues[confidenceLevel] ?? 1.96;
  const e = marginErrorPct / 100;
  const p = 0.5;
  if (populationSize <= 0 || e <= 0) return 0;
  const n0 = (z ** 2 * p * (1 - p)) / (e ** 2);
  const n = n0 / (1 + (n0 - 1) / populationSize);
  return Math.round(n + 0.5);
}

export function contactsNeeded(requiredCompletes: number, responseRatePct: number): number {
  if (requiredCompletes <= 0 || responseRatePct <= 0) return 0;
  return Math.round(requiredCompletes / (responseRatePct / 100) + 0.5);
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateRandomSample(rows: SamplePanelistRow[], size: number, seed = 42): SamplePanelistRow[] {
  if (size <= 0 || rows.length === 0) return [];
  const n = Math.min(size, rows.length);
  return seededShuffle(rows, seed).slice(0, n);
}

export function sampleRowsToCsv(rows: SamplePanelistRow[]): string {
  const headers = [
    "first_name",
    "last_name",
    "place_of_residence",
    "district",
    "city_town_village",
    "country_if_abroad",
    "constituency",
    "registered_ctv_area",
    "sex",
    "age",
    "age_group",
    "phone_whatsapp",
    "email",
    "verification_status",
  ];
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.firstName,
        row.lastName,
        row.placeOfResidence,
        row.district,
        row.cityTownVillage,
        row.countryIfAbroad,
        row.constituency,
        row.registeredCtvArea,
        row.sex,
        row.age ?? "",
        row.ageGroup,
        row.phone,
        row.email,
        row.verificationStatus,
      ]
        .map((v) => escape(String(v)))
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export function sortSampleRows(
  rows: SamplePanelistRow[],
  key: keyof SamplePanelistRow,
  direction: "asc" | "desc"
): SamplePanelistRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") return factor * (av - bv);
    return factor * String(av ?? "").localeCompare(String(bv ?? ""), undefined, { sensitivity: "base" });
  });
}
