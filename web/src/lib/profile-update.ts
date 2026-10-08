import {
  CITY_TOWN_VILLAGE,
  OTHER_CONTACT_PLATFORM_OPTIONS,
  getRegisteredCtvOptions,
} from "./constants";
import type { PanelistRow } from "./panelists";
import type { ProfileUpdateFormData } from "./profile-update-types";
import { parseStreetAddress } from "./street-address";
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

  const constituency = row.constituency ?? "";
  const ctvStored = cleanText(row.registered_ctv_area);
  const ctvOptions = getRegisteredCtvOptions(constituency);
  let registeredCtvArea = ctvStored;
  let registeredCtvAreaOther = "";
  if (ctvStored && !ctvOptions.includes(ctvStored)) {
    registeredCtvArea = "Other";
    registeredCtvAreaOther = ctvStored;
  }

  const otherPlatform = cleanText(row.other_contact_platform);
  const otherContact = cleanText(row.other_contact);
  const legacyInstagram = cleanText(row.instagram);
  const legacyTiktok = cleanText(row.tiktok);
  let otherContactPlatform = OTHER_CONTACT_PLATFORM_OPTIONS.includes(otherPlatform)
    ? otherPlatform
    : otherPlatform
      ? "Other"
      : "";
  let otherContactPlatformCustom = OTHER_CONTACT_PLATFORM_OPTIONS.includes(otherPlatform)
    ? ""
    : otherPlatform;
  let otherContactValue = otherContact;

  // Older profiles stored Instagram/TikTok as dedicated fields; fold them into Other contact.
  if (!otherContactValue) {
    if (legacyInstagram) {
      otherContactPlatform = "Instagram";
      otherContactPlatformCustom = "";
      otherContactValue = legacyInstagram;
    } else if (legacyTiktok) {
      otherContactPlatform = "TikTok";
      otherContactPlatformCustom = "";
      otherContactValue = legacyTiktok;
    }
  }

  return {
    education: row.education ?? "",
    citizenshipStatus: row.citizenship_status ?? "",
    commonwealthCountry: row.commonwealth_country ?? "",
    votingStatus: row.voting_status ?? "",
    constituency,
    registeredCtvArea,
    registeredCtvAreaOther,
    facebook: row.facebook ?? "",
    instagram: "",
    tiktok: "",
    otherContactPlatform,
    otherContactPlatformCustom,
    otherContact: otherContactValue,
    ...parseStreetAddress(row.street_address ?? ""),
    placeOfResidence,
    cityTownVillage,
    cityTownVillageOther,
    countryIfAbroad: row.country_if_abroad ?? "",
    countryIfAbroadOther: row.country_if_abroad_other ?? "",
    usDiasporaRegion:
      placeOfResidence === "Abroad"
        ? cleanText(row.residence_region) || cityStored
        : "",
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
