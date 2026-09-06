import { BELIZE_DISTRICTS } from "./constants";

export type StreetAddressParts = {
  streetAddress: string;
  addressCityVillage: string;
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

export function composeStreetAddress(parts: StreetAddressParts): string {
  const street = titleCaseStreetLine(parts.streetAddress);
  const city = trim(parts.addressCityVillage);
  const district = trim(parts.addressDistrict);
  return [street, city, district].filter(Boolean).join(", ");
}

export function formatStreetAddressDisplay(parts: StreetAddressParts): string {
  return composeStreetAddress(parts) || "Not provided";
}

/** Split a stored `street_address` back into structured fields when possible. */
export function parseStreetAddress(stored: string): StreetAddressParts {
  const value = trim(stored).replace(/\s*\n\s*/g, ", ");
  if (!value) {
    return { streetAddress: "", addressCityVillage: "", addressDistrict: "" };
  }

  const districts = [...BELIZE_DISTRICTS].sort((a, b) => b.length - a.length);
  for (const district of districts) {
    const escaped = district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = value.match(new RegExp(`^(.*?),\\s*${escaped}\\s*$`, "i"));
    if (!match) continue;

    const beforeDistrict = trim(match[1]);
    const lastComma = beforeDistrict.lastIndexOf(",");
    if (lastComma >= 0) {
      return {
        streetAddress: trim(beforeDistrict.slice(0, lastComma)),
        addressCityVillage: trim(beforeDistrict.slice(lastComma + 1)),
        addressDistrict: district,
      };
    }
    return {
      streetAddress: beforeDistrict,
      addressCityVillage: "",
      addressDistrict: district,
    };
  }

  return {
    streetAddress: value,
    addressCityVillage: "",
    addressDistrict: "",
  };
}

export function streetAddressPartsPresent(parts: StreetAddressParts): boolean {
  return Boolean(
    trim(parts.streetAddress) || trim(parts.addressCityVillage) || trim(parts.addressDistrict)
  );
}

export function validateStreetAddressParts(
  parts: StreetAddressParts,
  options: { required: boolean }
): Partial<Record<"streetAddress" | "addressCityVillage" | "addressDistrict", string>> {
  const errors: Partial<Record<"streetAddress" | "addressCityVillage" | "addressDistrict", string>> = {};
  const anyFilled = streetAddressPartsPresent(parts);
  if (!options.required && !anyFilled) return errors;

  if (!trim(parts.streetAddress)) {
    errors.streetAddress = "Street address is required.";
  }
  if (!trim(parts.addressCityVillage)) {
    errors.addressCityVillage = "City or Village is required.";
  }
  const district = trim(parts.addressDistrict);
  if (!district) {
    errors.addressDistrict = "District is required.";
  } else if (!BELIZE_DISTRICTS.includes(district)) {
    errors.addressDistrict = "Please select a Belize district.";
  }

  return errors;
}
