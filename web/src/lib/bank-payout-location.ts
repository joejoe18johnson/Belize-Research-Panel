import { BELIZE_DISTRICTS, CITY_TOWN_VILLAGE } from "./constants";
import { cleanText } from "./validation";

export interface BankPayoutLocationDefaults {
  district: string;
  cityTownVillage: string;
  cityTownVillageOther: string;
}

export function resolveBankLocationDefaults(profile: {
  district: string;
  placeOfResidence: string;
  cityTownVillage: string;
}): BankPayoutLocationDefaults {
  const districtRaw = cleanText(profile.district);
  const place = cleanText(profile.placeOfResidence);
  const district =
    districtRaw && districtRaw !== "Not provided"
      ? districtRaw
      : place && place !== "Living abroad" && BELIZE_DISTRICTS.includes(place)
        ? place
        : "";

  const cityStored =
    cleanText(profile.cityTownVillage) && profile.cityTownVillage !== "Not provided"
      ? cleanText(profile.cityTownVillage)
      : "";

  if (!district || !cityStored) {
    return { district, cityTownVillage: "", cityTownVillageOther: "" };
  }

  const options = CITY_TOWN_VILLAGE[district] ?? [];
  if (options.includes(cityStored)) {
    return { district, cityTownVillage: cityStored, cityTownVillageOther: "" };
  }

  return { district, cityTownVillage: "Other", cityTownVillageOther: cityStored };
}

export function formatBankPayoutCity(details: Record<string, string>): string {
  const city = cleanText(details.cityTownVillage);
  if (!city) return "—";
  if (city === "Other") return cleanText(details.cityTownVillageOther) || "—";
  return city;
}

export function validateBankPayoutLocation(
  details: Record<string, string>,
  errors: Record<string, string>
): void {
  const district = cleanText(details.district);
  if (!district) {
    errors.district = "District is required.";
  } else if (!BELIZE_DISTRICTS.includes(district)) {
    errors.district = "Please select a valid district.";
  }

  const city = cleanText(details.cityTownVillage);
  if (!city) {
    errors.cityTownVillage = "City / town / village is required.";
  } else if (district && city !== "Other") {
    const options = CITY_TOWN_VILLAGE[district] ?? [];
    if (options.length > 0 && !options.includes(city)) {
      errors.cityTownVillage = "Please select a city / town / village in this district.";
    }
  }

  if (city === "Other" && !cleanText(details.cityTownVillageOther)) {
    errors.cityTownVillageOther = "Please specify city / town / village.";
  }
}

export function mergeBankPayoutLocationDetails(
  details: Record<string, string>,
  source: Record<string, string>
): void {
  const district = cleanText(source.district);
  if (district) details.district = district;

  const city = cleanText(source.cityTownVillage);
  if (!city) return;

  details.cityTownVillage = city;
  if (city === "Other") {
    const other = cleanText(source.cityTownVillageOther);
    if (other) details.cityTownVillageOther = other;
  }
}
