import raw from "./constants.json";

export type RegistrationMode = "Self-registration" | "Registration by authorised person";

export const CITIZENSHIP_BELIZEAN_IN_BELIZE = "Belizean residing in Belize";
export const CITIZENSHIP_BELIZEAN_ABROAD = "Belizean residing abroad (diaspora)";
export const CITIZENSHIP_COMMONWEALTH_IN_BELIZE = "Commonwealth citizen residing in Belize";
export const CITIZENSHIP_FOREIGNER_IN_BELIZE = "Other foreigner permanently residing in Belize";
export const CITIZENSHIP_OTHER = "Other";

export const CITIZENSHIP_STATUS = raw.CITIZENSHIP_STATUS as string[];

export const ELIGIBLE_CITIZENSHIP_STATUSES = [
  CITIZENSHIP_BELIZEAN_IN_BELIZE,
  CITIZENSHIP_BELIZEAN_ABROAD,
  CITIZENSHIP_COMMONWEALTH_IN_BELIZE,
  CITIZENSHIP_FOREIGNER_IN_BELIZE,
] as const;

export const MARKET_RESEARCH_ONLY_CITIZENSHIP_STATUSES: readonly string[] = [];

export const INELIGIBLE_CITIZENSHIP_STATUSES = [CITIZENSHIP_OTHER] as const;

export const CITIZENSHIP_PANEL_INTRO =
  "Choose the option that best describes your citizenship and where you live. " +
  "The panel is open to Belizeans in Belize, Belizeans abroad (diaspora), Commonwealth citizens residing in Belize, " +
  "and other foreigners permanently residing in Belize.";

export type EligibleCitizenshipStatus = (typeof ELIGIBLE_CITIZENSHIP_STATUSES)[number];
export const VOTING_STATUS = raw.VOTING_STATUS as string[];
export const BELIZE_DISTRICTS = raw.BELIZE_DISTRICTS as string[];
export const PLACE_OPTIONS = raw.PLACE_OPTIONS as string[];
export const CONSTITUENCIES = raw.CONSTITUENCIES as string[];
export const CITY_TOWN_VILLAGE = raw.CITY_TOWN_VILLAGE as Record<string, string[]>;

/** All Belize cities, towns, and villages (unique, sorted), for typeahead search. */
export const ALL_BELIZE_CTVS: string[] = (() => {
  const names = new Set<string>();
  for (const list of Object.values(CITY_TOWN_VILLAGE)) {
    for (const name of list) {
      const cleaned = name.trim();
      if (cleaned && cleaned !== "Other") names.add(cleaned);
    }
  }
  for (const list of Object.values(raw.CONSTITUENCY_CTV as Record<string, string[]>)) {
    for (const name of list) {
      const cleaned = name.trim();
      if (cleaned && cleaned !== "Other") names.add(cleaned);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
})();

export function findDistrictForCtv(ctv: string): string | null {
  const needle = ctv.trim().toLowerCase();
  if (!needle) return null;
  for (const [district, list] of Object.entries(CITY_TOWN_VILLAGE)) {
    if (list.some((name) => name.trim().toLowerCase() === needle)) return district;
  }
  return null;
}

/** Prefix-first CTV suggestions as the user types (e.g. "B" → Barranco, Belmopan…). */
export function filterBelizeCtvs(query: string, limit = 12): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of ALL_BELIZE_CTVS) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) starts.push(name);
    else if (lower.includes(q)) contains.push(name);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

export function sortDropdownOptions(options: string[]): string[] {
  const cleaned = options.map((o) => o.trim()).filter(Boolean);
  const unique = [...new Set(cleaned)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  const prefer = unique.filter((x) => x === "Prefer not to say");
  const other = unique.filter((x) => x === "Other");
  const regular = unique.filter((x) => x !== "Other" && x !== "Prefer not to say");
  return [...regular, ...other, ...prefer];
}

export const COUNTRIES = sortDropdownOptions(raw.COUNTRIES as string[]);
export const COMMONWEALTH_COUNTRIES = sortDropdownOptions(raw.COMMONWEALTH_COUNTRIES as string[]);
export const OTHER_CONTACT_PLATFORM_OPTIONS = raw.OTHER_CONTACT_PLATFORM_OPTIONS as string[];
export const SEX_OPTIONS = raw.SEX_OPTIONS as string[];
export const EDUCATION_LEVELS = raw.EDUCATION_LEVELS as string[];
export const ETHNICITY_OPTIONS = raw.ETHNICITY_OPTIONS as string[];
export const HOUSEHOLD_HEAD_YES = "Yes";
export const HOUSEHOLD_HEAD_NO = "No";
export const HOUSEHOLD_HEAD_SELF = HOUSEHOLD_HEAD_YES;
export const HOUSEHOLD_HEAD_OTHER = HOUSEHOLD_HEAD_NO;
export const HOUSEHOLD_HEAD_OPTIONS = [HOUSEHOLD_HEAD_YES, HOUSEHOLD_HEAD_NO] as const;
export const YES_NO_OPTIONS = [HOUSEHOLD_HEAD_YES, HOUSEHOLD_HEAD_NO] as const;

export const ORG_OPERATION_SIZES = [
  "No employees",
  "Micro (1-9 employees)",
  "Small (10-49 employees)",
  "Medium (50-99 employees)",
  "Large (100+ employees)",
] as const;

export const ORG_OWNERSHIP_STRUCTURES = [
  "Sole proprietorship",
  "Partnership",
  "Private company",
  "Cooperative",
  "Non-profit organisation",
  "Other",
] as const;

export function ownsBusinessOrNgo(value: string): boolean {
  return value === HOUSEHOLD_HEAD_YES;
}

export const HOUSEHOLD_DEFINITION =
  "A household is a person or group of people living together in the same dwelling and sharing meals and other living arrangements, whether or not they are related.";
export const HEAD_OF_HOUSEHOLD_DEFINITION =
  "The head of household is the person who is recognised by the household members as the main decision-maker or person primarily responsible for the household.";
export const MAX_HOUSEHOLD_SIZE = 50;

export function isHeadOfHousehold(relationship: string): boolean {
  return relationship === HOUSEHOLD_HEAD_YES || relationship === "I am the head of my household";
}

export function cityTownVillageQuestionLabel(district: string): string {
  return `City / town / village in ${district} where you currently live`;
}

export const POLITICAL_INTERESTS = raw.POLITICAL_INTERESTS as string[];
export const MARKET_INTERESTS = raw.MARKET_INTERESTS as string[];
export const MAX_MARKET_INTERESTS = 5;
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
export const US_DIASPORA_REGIONS = raw.US_DIASPORA_REGIONS as string[];

const UNITED_STATES_COUNTRY_NAMES = new Set(["United States", "USA", "United States of America"]);

export function isUnitedStatesCountry(country: string): boolean {
  return UNITED_STATES_COUNTRY_NAMES.has(country.trim());
}
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
  "household_head_relationship",
  "household_size",
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
  "authorised_verification_code",
  "authorised_registrar_name",
  "residence_region",
  "username",
  "password_salt",
  "password_hash",
  "verification_status",
  "admin_email_approved",
  "admin_phone_approved",
  "admin_photo_id_approved",
  "consent_research",
  "consent_contact",
  "consent_privacy",
  "owns_business_or_ngo",
  "organisations",
  "org_name",
  "org_street_address",
  "org_city_village",
  "org_district",
  "org_description",
  "org_size",
  "org_ownership_structure",
  "org_ownership_structure_other",
  "org_year_started",
  "org_contact_means",
  "country_if_abroad_other",
  "status",
  "notes",
] as const;

export function getConstituencyOptions(): string[] {
  return [...CONSTITUENCIES].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function getRegisteredCtvOptions(constituency: string): string[] {
  if (!hasRegisteredCtvQuestion(constituency)) return [];
  const values = (CONSTITUENCY_CTV[constituency] ?? []).map((v) => v.trim()).filter(Boolean);
  const withOther = values.includes("Other") ? values : [...values, "Other"];
  return sortDropdownOptions(withOther);
}

/**
 * CTV breakdowns are only asked for constituencies made up of several towns/villages
 * (e.g. Cayo South). Urban/single-area seats like Belmopan or Mesopotamia are excluded.
 */
export function hasRegisteredCtvQuestion(constituency: string): boolean {
  const values = (CONSTITUENCY_CTV[constituency] ?? [])
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => !["Other", "Prefer not to say"].includes(v));
  return values.length > 1;
}

export function isMarketResearchOnlyCitizenship(citizenshipStatus: string): boolean {
  return MARKET_RESEARCH_ONLY_CITIZENSHIP_STATUSES.includes(citizenshipStatus);
}

export function isCommonwealthCitizenInBelize(citizenshipStatus: string): boolean {
  return (
    citizenshipStatus === CITIZENSHIP_COMMONWEALTH_IN_BELIZE ||
    citizenshipStatus === "Citizen of a Commonwealth country living in Belize"
  );
}

export function isBelizeanCitizenship(citizenshipStatus: string): boolean {
  return (
    citizenshipStatus === CITIZENSHIP_BELIZEAN_IN_BELIZE ||
    citizenshipStatus === CITIZENSHIP_BELIZEAN_ABROAD ||
    citizenshipStatus === "Citizen of Belize" ||
    citizenshipStatus === "Citizen of Belize living in Belize not registered to vote"
  );
}

export function mustLiveAbroad(citizenshipStatus: string): boolean {
  return citizenshipStatus === CITIZENSHIP_BELIZEAN_ABROAD;
}

export function mustLiveInBelize(citizenshipStatus: string): boolean {
  return (
    citizenshipStatus === CITIZENSHIP_BELIZEAN_IN_BELIZE ||
    isCommonwealthCitizenInBelize(citizenshipStatus) ||
    citizenshipStatus === CITIZENSHIP_FOREIGNER_IN_BELIZE ||
    citizenshipStatus === "Other resident of Belize" ||
    citizenshipStatus === "Other national living in Belize not registered to vote" ||
    isMarketResearchOnlyCitizenship(citizenshipStatus)
  );
}

export function needsVoterRegistrationQuestion(citizenshipStatus: string): boolean {
  return isBelizeanCitizenship(citizenshipStatus) || isCommonwealthCitizenInBelize(citizenshipStatus);
}

export function storedVotingStatus(citizenshipStatus: string, votingStatus: string): string {
  if (needsVoterRegistrationQuestion(citizenshipStatus)) return votingStatus;
  if (citizenshipStatus === CITIZENSHIP_FOREIGNER_IN_BELIZE || citizenshipStatus === "Other resident of Belize") {
    return "No";
  }
  return "Not registered to vote in Belize";
}

export function getResidenceOptions(citizenshipStatus: string): string[] {
  if (mustLiveAbroad(citizenshipStatus)) {
    return ["Abroad"];
  }
  if (citizenshipStatus === CITIZENSHIP_OTHER) {
    return PLACE_OPTIONS;
  }
  if (mustLiveInBelize(citizenshipStatus)) {
    return BELIZE_DISTRICTS;
  }
  return PLACE_OPTIONS;
}
