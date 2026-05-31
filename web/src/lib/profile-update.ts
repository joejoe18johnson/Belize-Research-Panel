import {
  CITY_TOWN_VILLAGE,
  OTHER_CONTACT_PLATFORM_OPTIONS,
} from "./constants";
import type { PanelistRow } from "./panelists";
import type { ProfileUpdateFormData } from "./profile-update-types";
import { cleanText, parseStoredPhoneNumber } from "./validation";

function splitInterests(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function profileUpdateFormFromRow(row: PanelistRow): ProfileUpdateFormData {
  const placeOfResidence = cleanText(row.place_of_residence);
  const cityStored = cleanText(row.city_town_village);

  let cityTownVillage = cityStored;
  let cityTownVillageOther = "";

  if (placeOfResidence && placeOfResidence !== "Abroad") {
    const options = CITY_TOWN_VILLAGE[placeOfResidence] ?? [];
    if (cityStored && !options.includes(cityStored)) {
      cityTownVillage = "Other";
      cityTownVillageOther = cityStored;
    }
  }

  const otherPlatform = cleanText(row.other_contact_platform);
  const isKnownPlatform = OTHER_CONTACT_PLATFORM_OPTIONS.includes(otherPlatform);

  return {
    education: row.education ?? "",
    citizenshipStatus: row.citizenship_status ?? "",
    commonwealthCountry: row.commonwealth_country ?? "",
    votingStatus: row.voting_status ?? "",
    constituency: row.constituency ?? "",
    registeredCtvArea: row.registered_ctv_area ?? "",
    facebook: row.facebook ?? "",
    instagram: row.instagram ?? "",
    tiktok: row.tiktok ?? "",
    otherContactPlatform: isKnownPlatform ? otherPlatform : otherPlatform ? "Other" : "",
    otherContactPlatformCustom: isKnownPlatform ? "" : otherPlatform,
    otherContact: row.other_contact ?? "",
    streetAddress: row.street_address ?? "",
    placeOfResidence,
    cityTownVillage,
    cityTownVillageOther,
    countryIfAbroad: row.country_if_abroad ?? "",
    politicalInterests: splitInterests(row.political_interests ?? ""),
    marketInterests: splitInterests(row.market_interests ?? ""),
    civicInterests: splitInterests(row.civic_interests ?? ""),
  };
}

export function profileContactFromRow(row: PanelistRow, accountEmail: string) {
  const { phoneCountryCode, phoneLocalNumber } = parseStoredPhoneNumber(row.phone_whatsapp ?? "");
  return {
    email: cleanText(accountEmail) || cleanText(row.email),
    phone: cleanText(row.phone_whatsapp),
    phoneCountryCode,
    phoneLocalNumber,
  };
}
