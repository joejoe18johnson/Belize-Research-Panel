import type { RegistrationFormData } from "./registration-types";

export type OrganisationEntry = {
  name: string;
  streetAddress: string;
  cityVillage: string;
  district: string;
  description: string;
  size: string;
  ownershipStructure: string;
  ownershipStructureOther: string;
  yearStarted: string;
  contactMeans: string;
};

export function emptyOrganisationEntry(): OrganisationEntry {
  return {
    name: "",
    streetAddress: "",
    cityVillage: "",
    district: "",
    description: "",
    size: "",
    ownershipStructure: "",
    ownershipStructureOther: "",
    yearStarted: "",
    contactMeans: "",
  };
}

export function organisationErrorKey(index: number, field: keyof OrganisationEntry): string {
  return `organisations.${index}.${field}`;
}

export function parseOrganisationErrorKey(
  key: string
): { index: number; field: keyof OrganisationEntry } | null {
  const match = /^organisations\.(\d+)\.([A-Za-z]+)$/.exec(key);
  if (!match) return null;
  return {
    index: Number(match[1]),
    field: match[2] as keyof OrganisationEntry,
  };
}

/** Migrate legacy single-org draft/API payloads into organisations[]. */
export function organisationsFromLegacyFlat(data: {
  orgName?: string;
  orgStreetAddress?: string;
  orgCityVillage?: string;
  orgDistrict?: string;
  orgDescription?: string;
  orgSize?: string;
  orgOwnershipStructure?: string;
  orgOwnershipStructureOther?: string;
  orgYearStarted?: string;
  orgContactMeans?: string;
  organisations?: OrganisationEntry[];
}): OrganisationEntry[] {
  if (Array.isArray(data.organisations) && data.organisations.length > 0) {
    return data.organisations.map((entry) => ({
      ...emptyOrganisationEntry(),
      ...entry,
    }));
  }

  const legacy = emptyOrganisationEntry();
  legacy.name = String(data.orgName ?? "").trim();
  legacy.streetAddress = String(data.orgStreetAddress ?? "").trim();
  legacy.cityVillage = String(data.orgCityVillage ?? "").trim();
  legacy.district = String(data.orgDistrict ?? "").trim();
  legacy.description = String(data.orgDescription ?? "").trim();
  legacy.size = String(data.orgSize ?? "").trim();
  legacy.ownershipStructure = String(data.orgOwnershipStructure ?? "").trim();
  legacy.ownershipStructureOther = String(data.orgOwnershipStructureOther ?? "").trim();
  legacy.yearStarted = String(data.orgYearStarted ?? "").trim();
  legacy.contactMeans = String(data.orgContactMeans ?? "").trim();

  const hasAny = Object.values(legacy).some((value) => Boolean(value));
  return hasAny ? [legacy] : [];
}

export function firstOrganisationOrEmpty(
  organisations: OrganisationEntry[]
): OrganisationEntry {
  return organisations[0] ?? emptyOrganisationEntry();
}

export function ensureOrganisationsForOwnership(
  ownsYes: boolean,
  organisations: OrganisationEntry[]
): OrganisationEntry[] {
  if (!ownsYes) return [];
  return organisations.length > 0 ? organisations : [emptyOrganisationEntry()];
}

export type LegacyOrgFlatFields = {
  orgName: string;
  orgStreetAddress: string;
  orgCityVillage: string;
  orgDistrict: string;
  orgDescription: string;
  orgSize: string;
  orgOwnershipStructure: string;
  orgOwnershipStructureOther: string;
  orgYearStarted: string;
  orgContactMeans: string;
};

export function flattenFirstOrganisation(
  organisations: OrganisationEntry[]
): LegacyOrgFlatFields {
  const first = firstOrganisationOrEmpty(organisations);
  return {
    orgName: first.name,
    orgStreetAddress: first.streetAddress,
    orgCityVillage: first.cityVillage,
    orgDistrict: first.district,
    orgDescription: first.description,
    orgSize: first.size,
    orgOwnershipStructure: first.ownershipStructure,
    orgOwnershipStructureOther: first.ownershipStructureOther,
    orgYearStarted: first.yearStarted,
    orgContactMeans: first.contactMeans,
  };
}

export function withNormalisedOrganisations<T extends Partial<RegistrationFormData>>(
  data: T
): T & { organisations: OrganisationEntry[] } {
  const organisations = organisationsFromLegacyFlat(data as RegistrationFormData);
  return { ...data, organisations };
}
