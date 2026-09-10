import { BELIZE_DISTRICTS, getCtvOptionsForDistrict } from "./constants";

export type StreetAddressParts = {
  addressHouseNumber: string;
  streetAddress: string;
  addressCityVillage: string;
  addressCityVillageOther: string;
  addressDistrict: string;
};

function trim(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function titleCaseStreetLine(address: string): string {
  return String(address ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ")
    )
    .join(" ")
    .trim();
}

export function resolvedAddressCityVillage(parts: Pick<StreetAddressParts, "addressCityVillage" | "addressCityVillageOther">): string {
  const city = trim(parts.addressCityVillage);
  if (city === "Other") return trim(parts.addressCityVillageOther);
  return city;
}

export function composeStreetAddress(parts: StreetAddressParts): string {
  const house = trim(parts.addressHouseNumber);
  const street = titleCaseStreetLine(parts.streetAddress);
  const line = [house, street].filter(Boolean).join(" ");
  const city = resolvedAddressCityVillage(parts);
  const district = trim(parts.addressDistrict);
  return [line, city, district].filter(Boolean).join(", ");
}

export function formatStreetAddressDisplay(parts: StreetAddressParts): string {
  return composeStreetAddress(parts) || "Not provided";
}

function looksLikeHouseNumber(token: string): boolean {
  return /^[0-9]+[A-Za-z]?([/-][0-9A-Za-z]+)?$/.test(token) || /^[A-Za-z]?[0-9]+[A-Za-z]?$/.test(token);
}

/** Split a stored `street_address` back into structured fields when possible. */
export function parseStreetAddress(stored: string): StreetAddressParts {
  const empty: StreetAddressParts = {
    addressHouseNumber: "",
    streetAddress: "",
    addressCityVillage: "",
    addressCityVillageOther: "",
    addressDistrict: "",
  };
  const value = trim(stored).replace(/\s*\n\s*/g, ", ");
  if (!value) return empty;

  const districts = [...BELIZE_DISTRICTS].sort((a, b) => b.length - a.length);
  let streetLine = value;
  let city = "";
  let district = "";

  for (const districtName of districts) {
    const escaped = districtName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = value.match(new RegExp(`^(.*?),\\s*${escaped}\\s*$`, "i"));
    if (!match) continue;

    const beforeDistrict = trim(match[1]);
    const lastComma = beforeDistrict.lastIndexOf(",");
    if (lastComma >= 0) {
      streetLine = trim(beforeDistrict.slice(0, lastComma));
      city = trim(beforeDistrict.slice(lastComma + 1));
    } else {
      streetLine = beforeDistrict;
      city = "";
    }
    district = districtName;
    break;
  }

  let addressHouseNumber = "";
  let streetAddress = streetLine;
  const tokens = streetLine.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2 && looksLikeHouseNumber(tokens[0])) {
    addressHouseNumber = tokens[0];
    streetAddress = tokens.slice(1).join(" ");
  }

  let addressCityVillage = city;
  let addressCityVillageOther = "";
  if (city && district) {
    const options = getCtvOptionsForDistrict(district);
    if (city !== "Other" && !options.includes(city)) {
      addressCityVillage = "Other";
      addressCityVillageOther = city;
    }
  }

  return {
    addressHouseNumber,
    streetAddress,
    addressCityVillage,
    addressCityVillageOther,
    addressDistrict: district,
  };
}

export function streetAddressPartsPresent(parts: StreetAddressParts): boolean {
  return Boolean(
    trim(parts.addressHouseNumber) ||
      trim(parts.streetAddress) ||
      trim(parts.addressCityVillage) ||
      trim(parts.addressCityVillageOther) ||
      trim(parts.addressDistrict)
  );
}

export function validateStreetAddressParts(
  parts: StreetAddressParts,
  options: { required: boolean }
): Partial<
  Record<
    "addressHouseNumber" | "streetAddress" | "addressCityVillage" | "addressCityVillageOther" | "addressDistrict",
    string
  >
> {
  const errors: Partial<
    Record<
      "addressHouseNumber" | "streetAddress" | "addressCityVillage" | "addressCityVillageOther" | "addressDistrict",
      string
    >
  > = {};
  const anyFilled = streetAddressPartsPresent(parts);
  if (!options.required && !anyFilled) return errors;

  const district = trim(parts.addressDistrict);
  if (!district) {
    errors.addressDistrict = "District is required.";
  } else if (!BELIZE_DISTRICTS.includes(district)) {
    errors.addressDistrict = "Please select a Belize district.";
  }

  const city = trim(parts.addressCityVillage);
  if (!city) {
    errors.addressCityVillage = "City, town, or village is required.";
  } else if (district) {
    const options = getCtvOptionsForDistrict(district);
    if (options.length && !options.includes(city)) {
      errors.addressCityVillage = "Please select a city, town, or village in the chosen district.";
    }
  }
  if (city === "Other" && !trim(parts.addressCityVillageOther)) {
    errors.addressCityVillageOther = "Please specify the city, town, or village.";
  }

  if (!trim(parts.streetAddress)) {
    errors.streetAddress = "Street name is required.";
  }

  return errors;
}
