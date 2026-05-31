import raw from "./constants.json";

export type RegistrationMode = "Self-registration" | "Registration by authorised person";

export const CITIZENSHIP_STATUS = raw.CITIZENSHIP_STATUS as string[];

export const ELIGIBLE_CITIZENSHIP_STATUSES = [
  "Citizen of Belize",
  "Citizen of a Commonwealth country living in Belize",
] as const;

export type EligibleCitizenshipStatus = (typeof ELIGIBLE_CITIZENSHIP_STATUSES)[number];
export const VOTING_STATUS = raw.VOTING_STATUS as string[];
export const BELIZE_DISTRICTS = raw.BELIZE_DISTRICTS as string[];
export const PLACE_OPTIONS = raw.PLACE_OPTIONS as string[];
export const CONSTITUENCIES = raw.CONSTITUENCIES as string[];
export const CITY_TOWN_VILLAGE = raw.CITY_TOWN_VILLAGE as Record<string, string[]>;
export const COUNTRIES = raw.COUNTRIES as string[];
export const OTHER_CONTACT_PLATFORM_OPTIONS = raw.OTHER_CONTACT_PLATFORM_OPTIONS as string[];
export const SEX_OPTIONS = raw.SEX_OPTIONS as string[];
export const EDUCATION_LEVELS = raw.EDUCATION_LEVELS as string[];
export const ETHNICITY_OPTIONS = raw.ETHNICITY_OPTIONS as string[];
export const POLITICAL_INTERESTS = raw.POLITICAL_INTERESTS as string[];
export const MARKET_INTERESTS = raw.MARKET_INTERESTS as string[];
export const CIVIC_INTERESTS = raw.CIVIC_INTERESTS as string[];
export const PHOTO_ID_TYPES = raw.PHOTO_ID_TYPES.filter((t) => {
  const normalized = t.trim().toLowerCase();
  return (
    normalized !== "none" &&
    normalized !== "prefer not to say" &&
    !normalized.startsWith("none /")
  );
}) as string[];
export const COMMONWEALTH_RESIDENCE_PROOF_TYPES = raw.COMMONWEALTH_RESIDENCE_PROOF_TYPES as string[];
export const COMMONWEALTH_COUNTRIES = raw.COMMONWEALTH_COUNTRIES as string[];
export const US_DIASPORA_REGIONS = raw.US_DIASPORA_REGIONS as string[];
export const CONSTITUENCY_CTV = raw.CONSTITUENCY_CTV as Record<string, string[]>;

export const PANELIST_COLUMNS = [
  "registration_date",
  "first_name",
  "last_name",
  "dob",
  "age",
  "citizenship_status",
  "commonwealth_country",
  "voting_status",
  "voter_status",
  "place_of_residence",
  "district",
  "city_town_village",
  "country_if_abroad",
  "constituency",
  "registered_ctv_area",
  "sex",
  "education",
  "ethnicity",
  "political_interests",
  "market_interests",
  "civic_interests",
  "email",
  "phone_whatsapp",
  "facebook",
  "instagram",
  "tiktok",
  "other_contact",
  "other_contact_platform",
  "street_address",
  "photo_id_type",
  "photo_id_last4",
  "username",
  "password_salt",
  "password_hash",
  "verification_status",
  "consent_research",
  "consent_contact",
  "consent_privacy",
  "status",
  "notes",
] as const;

export function sortDropdownOptions(options: string[]): string[] {
  const cleaned = options.map((o) => o.trim()).filter(Boolean);
  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const prefer = unique.filter((x) => x === "Prefer not to say");
  const other = unique.filter((x) => x === "Other");
  const regular = unique.filter((x) => x !== "Other" && x !== "Prefer not to say");
  return [...regular, ...other, ...prefer];
}

export function getConstituencyOptions(): string[] {
  return [...CONSTITUENCIES].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function getRegisteredCtvOptions(constituency: string): string[] {
  if (!constituency.trim()) return [];
  const values = (CONSTITUENCY_CTV[constituency] ?? []).map((v) => v.trim()).filter(Boolean);
  const realValues = values.filter((v) => !["Other", "Prefer not to say"].includes(v));
  if (realValues.length === 0) return [];
  const withOther = values.includes("Other") ? values : [...values, "Other"];
  return sortDropdownOptions(withOther);
}

export function hasRegisteredCtvQuestion(constituency: string): boolean {
  const values = (CONSTITUENCY_CTV[constituency] ?? []).map((v) => v.trim()).filter(Boolean);
  return values.filter((v) => !["Other", "Prefer not to say"].includes(v)).length > 0;
}

export function getResidenceOptions(citizenshipStatus: string): string[] {
  if (citizenshipStatus === "Citizen of a Commonwealth country living in Belize") {
    return BELIZE_DISTRICTS;
  }
  if (citizenshipStatus === "Citizen of Belize") {
    return PLACE_OPTIONS;
  }
  return BELIZE_DISTRICTS;
}
