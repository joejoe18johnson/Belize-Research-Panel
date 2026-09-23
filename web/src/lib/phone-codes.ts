export interface PhoneCountryCode {
  /**
   * Unique select value. Usually equals `code`; when two countries share a dial
   * code (US / Canada both +1), this distinguishes them in the dropdown.
   */
  id: string;
  /** E.164 country calling code used when composing the stored number. */
  code: string;
  country: string;
  label: string;
}

export interface PhoneNumberRule {
  /** Minimum national digits (without country code). */
  minLength: number;
  /** Maximum national digits (without country code). */
  maxLength: number;
  /** If set, the national number must start with one of these prefixes. */
  startsWith?: readonly string[];
  /** Short hint shown under the phone field. */
  hint: string;
  /** Placeholder example (digits only or hyphenated for display). */
  example: string;
  /** Digit group sizes for hyphenated display (e.g. Belize [3, 4] → 654-6789). */
  displayGroups: readonly number[];
}

export const DEFAULT_PHONE_COUNTRY_CODE = "+501";

/** NANP area/exchange codes never start with 0 or 1. */
const NANP_LEADING_DIGITS = ["2", "3", "4", "5", "6", "7", "8", "9"] as const;

/**
 * National (local) number rules by dialing code.
 * Lengths exclude the country code — what the registrant types in the local field.
 */
export const PHONE_NUMBER_RULES: Record<string, PhoneNumberRule> = {
  "+54": {
    minLength: 10,
    maxLength: 10,
    hint: "Argentina numbers use 10 digits.",
    example: "911-234-5678",
    displayGroups: [3, 3, 4],
  },
  "+61": {
    minLength: 9,
    maxLength: 9,
    hint: "Australia numbers use 9 digits (without the leading 0).",
    example: "412-345-678",
    displayGroups: [3, 3, 3],
  },
  "+1242": {
    minLength: 7,
    maxLength: 7,
    startsWith: NANP_LEADING_DIGITS,
    hint: "Bahamas numbers use 7 digits after +1 242 and start with 2–9.",
    example: "359-1234",
    displayGroups: [3, 4],
  },
  "+1246": {
    minLength: 7,
    maxLength: 7,
    startsWith: NANP_LEADING_DIGITS,
    hint: "Barbados numbers use 7 digits after +1 246 and start with 2–9.",
    example: "430-1234",
    displayGroups: [3, 4],
  },
  "+501": {
    minLength: 7,
    maxLength: 7,
    startsWith: ["6"],
    hint: "Belize mobile / WhatsApp numbers use exactly 7 digits and start with 6.",
    example: "612-3456",
    displayGroups: [3, 4],
  },
  "+55": {
    minLength: 10,
    maxLength: 11,
    hint: "Brazil numbers use 10–11 digits (including area code).",
    example: "11-98765-4321",
    displayGroups: [2, 5, 4],
  },
  "+56": {
    minLength: 9,
    maxLength: 9,
    hint: "Chile numbers use 9 digits.",
    example: "912-345-678",
    displayGroups: [3, 3, 3],
  },
  "+86": {
    minLength: 11,
    maxLength: 11,
    hint: "China mobile numbers use 11 digits.",
    example: "138-1234-5678",
    displayGroups: [3, 4, 4],
  },
  "+57": {
    minLength: 10,
    maxLength: 10,
    hint: "Colombia numbers use 10 digits.",
    example: "300-123-4567",
    displayGroups: [3, 3, 4],
  },
  "+506": {
    minLength: 8,
    maxLength: 8,
    hint: "Costa Rica numbers use 8 digits.",
    example: "8312-3456",
    displayGroups: [4, 4],
  },
  "+53": {
    minLength: 8,
    maxLength: 8,
    hint: "Cuba numbers use 8 digits.",
    example: "5123-4567",
    displayGroups: [4, 4],
  },
  "+593": {
    minLength: 9,
    maxLength: 9,
    hint: "Ecuador numbers use 9 digits.",
    example: "991-234-567",
    displayGroups: [3, 3, 3],
  },
  "+503": {
    minLength: 8,
    maxLength: 8,
    hint: "El Salvador numbers use 8 digits.",
    example: "7012-3456",
    displayGroups: [4, 4],
  },
  "+971": {
    minLength: 9,
    maxLength: 9,
    hint: "UAE numbers use 9 digits (without the leading 0).",
    example: "50-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+33": {
    minLength: 9,
    maxLength: 9,
    hint: "France numbers use 9 digits (without the leading 0).",
    example: "6-12-34-56-78",
    displayGroups: [1, 2, 2, 2, 2],
  },
  "+49": {
    minLength: 10,
    maxLength: 11,
    hint: "Germany numbers usually use 10–11 digits (without the leading 0).",
    example: "151-2345-6789",
    displayGroups: [3, 4, 4],
  },
  "+502": {
    minLength: 8,
    maxLength: 8,
    hint: "Guatemala numbers use 8 digits.",
    example: "5123-4567",
    displayGroups: [4, 4],
  },
  "+852": {
    minLength: 8,
    maxLength: 8,
    hint: "Hong Kong numbers use 8 digits.",
    example: "9123-4567",
    displayGroups: [4, 4],
  },
  "+504": {
    minLength: 8,
    maxLength: 8,
    hint: "Honduras numbers use 8 digits.",
    example: "9123-4567",
    displayGroups: [4, 4],
  },
  "+91": {
    minLength: 10,
    maxLength: 10,
    hint: "India mobile numbers use 10 digits.",
    example: "98765-43210",
    displayGroups: [5, 5],
  },
  "+353": {
    minLength: 9,
    maxLength: 9,
    hint: "Ireland numbers use 9 digits (without the leading 0).",
    example: "85-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+39": {
    minLength: 9,
    maxLength: 10,
    hint: "Italy mobile numbers usually use 9–10 digits.",
    example: "312-345-6789",
    displayGroups: [3, 3, 4],
  },
  "+1876": {
    minLength: 7,
    maxLength: 7,
    startsWith: NANP_LEADING_DIGITS,
    hint: "Jamaica numbers use 7 digits after +1 876 and start with 2–9.",
    example: "210-1234",
    displayGroups: [3, 4],
  },
  "+81": {
    minLength: 10,
    maxLength: 10,
    hint: "Japan mobile numbers use 10 digits (without the leading 0).",
    example: "90-1234-5678",
    displayGroups: [2, 4, 4],
  },
  "+52": {
    minLength: 10,
    maxLength: 10,
    hint: "Mexico numbers use 10 digits.",
    example: "55-1234-5678",
    displayGroups: [2, 4, 4],
  },
  "+31": {
    minLength: 9,
    maxLength: 9,
    hint: "Netherlands numbers use 9 digits (without the leading 0).",
    example: "6-1234-5678",
    displayGroups: [1, 4, 4],
  },
  "+64": {
    minLength: 8,
    maxLength: 10,
    hint: "New Zealand numbers usually use 8–10 digits (without the leading 0).",
    example: "21-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+234": {
    minLength: 10,
    maxLength: 10,
    hint: "Nigeria numbers use 10 digits (without the leading 0).",
    example: "801-234-5678",
    displayGroups: [3, 3, 4],
  },
  "+505": {
    minLength: 8,
    maxLength: 8,
    hint: "Nicaragua numbers use 8 digits.",
    example: "8123-4567",
    displayGroups: [4, 4],
  },
  "+507": {
    minLength: 8,
    maxLength: 8,
    hint: "Panama numbers use 8 digits.",
    example: "6123-4567",
    displayGroups: [4, 4],
  },
  "+63": {
    minLength: 10,
    maxLength: 10,
    hint: "Philippines mobile numbers use 10 digits.",
    example: "917-123-4567",
    displayGroups: [3, 3, 4],
  },
  "+51": {
    minLength: 9,
    maxLength: 9,
    hint: "Peru numbers use 9 digits.",
    example: "912-345-678",
    displayGroups: [3, 3, 3],
  },
  "+966": {
    minLength: 9,
    maxLength: 9,
    hint: "Saudi Arabia numbers use 9 digits (without the leading 0).",
    example: "512-345-678",
    displayGroups: [3, 3, 3],
  },
  "+65": {
    minLength: 8,
    maxLength: 8,
    hint: "Singapore numbers use 8 digits.",
    example: "8123-4567",
    displayGroups: [4, 4],
  },
  "+27": {
    minLength: 9,
    maxLength: 9,
    hint: "South Africa numbers use 9 digits (without the leading 0).",
    example: "82-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+82": {
    minLength: 9,
    maxLength: 10,
    hint: "South Korea numbers usually use 9–10 digits (without the leading 0).",
    example: "10-1234-5678",
    displayGroups: [2, 4, 4],
  },
  "+34": {
    minLength: 9,
    maxLength: 9,
    hint: "Spain numbers use 9 digits.",
    example: "612-345-678",
    displayGroups: [3, 3, 3],
  },
  "+46": {
    minLength: 9,
    maxLength: 9,
    hint: "Sweden numbers use 9 digits (without the leading 0).",
    example: "70-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+41": {
    minLength: 9,
    maxLength: 9,
    hint: "Switzerland numbers use 9 digits (without the leading 0).",
    example: "79-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+886": {
    minLength: 9,
    maxLength: 9,
    hint: "Taiwan mobile numbers use 9 digits.",
    example: "912-345-678",
    displayGroups: [3, 3, 3],
  },
  "+1868": {
    minLength: 7,
    maxLength: 7,
    startsWith: NANP_LEADING_DIGITS,
    hint: "Trinidad and Tobago numbers use 7 digits after +1 868 and start with 2–9.",
    example: "620-1234",
    displayGroups: [3, 4],
  },
  "+1": {
    minLength: 10,
    maxLength: 10,
    startsWith: NANP_LEADING_DIGITS,
    hint: "US and Canada numbers use 10 digits and start with 2–9 (area code + number).",
    example: "202-555-0123",
    displayGroups: [3, 3, 4],
  },
  "+44": {
    minLength: 10,
    maxLength: 10,
    hint: "UK numbers use 10 digits (without the leading 0).",
    example: "7400-123456",
    displayGroups: [4, 6],
  },
  "+58": {
    minLength: 10,
    maxLength: 10,
    hint: "Venezuela numbers use 10 digits.",
    example: "412-123-4567",
    displayGroups: [3, 3, 4],
  },
};

const DEFAULT_PHONE_RULE: PhoneNumberRule = {
  minLength: 7,
  maxLength: 15,
  hint: "Enter the phone number without the country code.",
  example: "123-4567",
  displayGroups: [3, 4],
};

/** Sorted alphabetically by country name for easier lookup. */
export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { id: "+54", code: "+54", country: "Argentina", label: "Argentina (+54)" },
  { id: "+61", code: "+61", country: "Australia", label: "Australia (+61)" },
  { id: "+1242", code: "+1242", country: "Bahamas", label: "Bahamas (+1 242)" },
  { id: "+1246", code: "+1246", country: "Barbados", label: "Barbados (+1 246)" },
  { id: "+501", code: "+501", country: "Belize", label: "Belize (+501)" },
  { id: "+55", code: "+55", country: "Brazil", label: "Brazil (+55)" },
  { id: "+1-CA", code: "+1", country: "Canada", label: "Canada (+1)" },
  { id: "+56", code: "+56", country: "Chile", label: "Chile (+56)" },
  { id: "+86", code: "+86", country: "China", label: "China (+86)" },
  { id: "+57", code: "+57", country: "Colombia", label: "Colombia (+57)" },
  { id: "+506", code: "+506", country: "Costa Rica", label: "Costa Rica (+506)" },
  { id: "+53", code: "+53", country: "Cuba", label: "Cuba (+53)" },
  { id: "+593", code: "+593", country: "Ecuador", label: "Ecuador (+593)" },
  { id: "+503", code: "+503", country: "El Salvador", label: "El Salvador (+503)" },
  { id: "+971", code: "+971", country: "United Arab Emirates", label: "United Arab Emirates (+971)" },
  { id: "+33", code: "+33", country: "France", label: "France (+33)" },
  { id: "+49", code: "+49", country: "Germany", label: "Germany (+49)" },
  { id: "+502", code: "+502", country: "Guatemala", label: "Guatemala (+502)" },
  { id: "+852", code: "+852", country: "Hong Kong", label: "Hong Kong (+852)" },
  { id: "+504", code: "+504", country: "Honduras", label: "Honduras (+504)" },
  { id: "+91", code: "+91", country: "India", label: "India (+91)" },
  { id: "+353", code: "+353", country: "Ireland", label: "Ireland (+353)" },
  { id: "+39", code: "+39", country: "Italy", label: "Italy (+39)" },
  { id: "+1876", code: "+1876", country: "Jamaica", label: "Jamaica (+1 876)" },
  { id: "+81", code: "+81", country: "Japan", label: "Japan (+81)" },
  { id: "+52", code: "+52", country: "Mexico", label: "Mexico (+52)" },
  { id: "+31", code: "+31", country: "Netherlands", label: "Netherlands (+31)" },
  { id: "+64", code: "+64", country: "New Zealand", label: "New Zealand (+64)" },
  { id: "+234", code: "+234", country: "Nigeria", label: "Nigeria (+234)" },
  { id: "+505", code: "+505", country: "Nicaragua", label: "Nicaragua (+505)" },
  { id: "+507", code: "+507", country: "Panama", label: "Panama (+507)" },
  { id: "+63", code: "+63", country: "Philippines", label: "Philippines (+63)" },
  { id: "+51", code: "+51", country: "Peru", label: "Peru (+51)" },
  { id: "+966", code: "+966", country: "Saudi Arabia", label: "Saudi Arabia (+966)" },
  { id: "+65", code: "+65", country: "Singapore", label: "Singapore (+65)" },
  { id: "+27", code: "+27", country: "South Africa", label: "South Africa (+27)" },
  { id: "+82", code: "+82", country: "South Korea", label: "South Korea (+82)" },
  { id: "+34", code: "+34", country: "Spain", label: "Spain (+34)" },
  { id: "+46", code: "+46", country: "Sweden", label: "Sweden (+46)" },
  { id: "+41", code: "+41", country: "Switzerland", label: "Switzerland (+41)" },
  { id: "+886", code: "+886", country: "Taiwan", label: "Taiwan (+886)" },
  { id: "+1868", code: "+1868", country: "Trinidad and Tobago", label: "Trinidad and Tobago (+1 868)" },
  { id: "+1", code: "+1", country: "United States", label: "United States (+1)" },
  { id: "+44", code: "+44", country: "United Kingdom", label: "United Kingdom (+44)" },
  { id: "+58", code: "+58", country: "Venezuela", label: "Venezuela (+58)" },
];

/** Resolve a select id or dial code to the E.164 dialing code used in stored numbers. */
export function resolvePhoneDialCode(countryCodeOrId: string): string {
  const match = PHONE_COUNTRY_CODES.find(
    (entry) => entry.id === countryCodeOrId || entry.code === countryCodeOrId
  );
  return match?.code ?? countryCodeOrId;
}

export function getPhoneNumberRule(countryCodeOrId: string): PhoneNumberRule {
  return PHONE_NUMBER_RULES[resolvePhoneDialCode(countryCodeOrId)] ?? DEFAULT_PHONE_RULE;
}

/** Format national digits with hyphens using the country display groups. */
export function formatPhoneLocalDisplay(digits: string, countryCodeOrId: string): string {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "";
  const groups = getPhoneNumberRule(countryCodeOrId).displayGroups;
  const parts: string[] = [];
  let index = 0;
  for (const size of groups) {
    if (index >= clean.length) break;
    parts.push(clean.slice(index, index + size));
    index += size;
  }
  if (index < clean.length) {
    parts.push(clean.slice(index));
  }
  return parts.filter(Boolean).join("-");
}

const COUNTRY_ALIASES: Record<string, string> = {
  USA: "United States",
  "United States of America": "United States",
  UK: "United Kingdom",
  "Great Britain": "United Kingdom",
  "Trinidad & Tobago": "Trinidad and Tobago",
};

export function phoneCountryCodeForCountry(country: string): string | null {
  const normalized = COUNTRY_ALIASES[country.trim()] ?? country.trim();
  const match = PHONE_COUNTRY_CODES.find(
    (entry) => entry.country.toLowerCase() === normalized.toLowerCase()
  );
  return match?.id ?? null;
}

export function isValidPhoneCountryCode(code: string): boolean {
  return PHONE_COUNTRY_CODES.some((entry) => entry.id === code || entry.code === code);
}

export function getPhoneCountryLabel(countryCodeOrId: string): string {
  const byId = PHONE_COUNTRY_CODES.find((entry) => entry.id === countryCodeOrId);
  if (byId) return byId.country;
  const byCode = PHONE_COUNTRY_CODES.find((entry) => entry.code === countryCodeOrId);
  return byCode?.country ?? "selected country";
}

function formatAllowedPrefixes(prefixes: readonly string[]): string {
  if (prefixes.length >= 2 && prefixes.every((prefix) => /^\d$/.test(prefix))) {
    const nums = prefixes.map(Number).sort((a, b) => a - b);
    const contiguous = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    if (contiguous) return `${nums[0]}–${nums[nums.length - 1]}`;
  }
  return prefixes.join(" or ");
}

/** Validate national digits for a country code. Empty input is allowed (optional field). */
export function validateNationalPhoneNumber(countryCodeOrId: string, localDigits: string): string | null {
  const digits = String(localDigits || "").replace(/\D/g, "");
  if (!digits) return null;
  if (!isValidPhoneCountryCode(countryCodeOrId)) {
    return "Please select a valid country code.";
  }

  const dialCode = resolvePhoneDialCode(countryCodeOrId);
  const rule = getPhoneNumberRule(countryCodeOrId);
  const country = getPhoneCountryLabel(countryCodeOrId);
  const exact = rule.minLength === rule.maxLength;

  if (digits.length < rule.minLength) {
    return exact
      ? `${country} phone numbers must be exactly ${rule.minLength} digits (without the country code).`
      : `${country} phone numbers need at least ${rule.minLength} digits (without the country code).`;
  }

  if (digits.length > rule.maxLength) {
    return exact
      ? `${country} phone numbers must be exactly ${rule.maxLength} digits (without the country code).`
      : `${country} phone numbers can have at most ${rule.maxLength} digits (without the country code).`;
  }

  if (rule.startsWith?.length) {
    const ok = rule.startsWith.some((prefix) => digits.startsWith(prefix));
    if (!ok) {
      if (dialCode === "+501") {
        return "Belize mobile / WhatsApp numbers must start with 6 (7 digits total, e.g. 6123456).";
      }
      if (dialCode === "+1") {
        return `${country} phone numbers must start with 2–9 (10 digits total, e.g. 2025550123).`;
      }
      const prefixes = formatAllowedPrefixes(rule.startsWith);
      return `${country} phone numbers must start with ${prefixes}.`;
    }
  }

  return null;
}
