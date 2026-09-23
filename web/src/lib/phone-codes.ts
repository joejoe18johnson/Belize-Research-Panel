import {
  parsePhoneNumberFromString,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";

export interface PhoneCountryCode {
  /**
   * Unique select value. Usually equals `code`; when two countries share a dial
   * code (US / Canada both +1), this distinguishes them in the dropdown.
   */
  id: string;
  /** E.164 country calling code used when composing the stored number. */
  code: string;
  /** ISO 3166-1 alpha-2 region for libphonenumber-js. */
  region: CountryCode;
  country: string;
  label: string;
}

export interface PhoneNumberRule {
  /** Minimum national digits (without country code) — used for input hints / early checks. */
  minLength: number;
  /** Maximum national digits (without country code) — caps the local input field. */
  maxLength: number;
  /**
   * Mobile-only national prefixes (without country code). Applied after libphonenumber
   * validity checks — needed where metadata returns no number type (e.g. Belize).
   */
  mobilePrefixes?: readonly string[];
  /**
   * For countries like Brazil: after a leading area code, the subscriber must match
   * these mobile prefixes.
   */
  mobileSubscriberAfterArea?: {
    areaCodeLength: number;
    prefixes: readonly string[];
  };
  /** Short hint shown under the phone field. */
  hint: string;
  /** Placeholder example (digits only or hyphenated for display). */
  example: string;
  /** Digit group sizes for hyphenated display (e.g. Belize [3, 4] → 654-6789). */
  displayGroups: readonly number[];
}

export const DEFAULT_PHONE_COUNTRY_CODE = "+501";

/** NANP area codes never start with 0 or 1. */
const NANP_LEADING_DIGITS = ["2", "3", "4", "5", "6", "7", "8", "9"] as const;

function prefixRange(start: number, end: number, width = String(start).length): string[] {
  const out: string[] = [];
  for (let n = start; n <= end; n += 1) {
    out.push(String(n).padStart(width, "0"));
  }
  return out;
}

/** UK mobiles: 071–075 and 077–079 (without the leading 0). */
const UK_MOBILE_PREFIXES = [...prefixRange(71, 75), ...prefixRange(77, 79)] as const;

/**
 * National (local) mobile UX rules by dialing code.
 * Length / format validity and mobile-vs-landline checks use libphonenumber-js.
 */
export const PHONE_NUMBER_RULES: Record<string, PhoneNumberRule> = {
  "+54": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: ["9"],
    hint: "Argentina mobile (e.g. 911-234-5678).",
    example: "911-234-5678",
    displayGroups: [3, 3, 4],
  },
  "+61": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["4"],
    hint: "Australia mobile — omit the leading 0 (e.g. 412-345-678).",
    example: "412-345-678",
    displayGroups: [3, 3, 3],
  },
  "+1242": {
    minLength: 7,
    maxLength: 7,
    mobilePrefixes: NANP_LEADING_DIGITS,
    hint: "Bahamas mobile after +1 242 (e.g. 359-1234).",
    example: "359-1234",
    displayGroups: [3, 4],
  },
  "+1246": {
    minLength: 7,
    maxLength: 7,
    mobilePrefixes: NANP_LEADING_DIGITS,
    hint: "Barbados mobile after +1 246 (e.g. 430-1234).",
    example: "430-1234",
    displayGroups: [3, 4],
  },
  "+501": {
    minLength: 7,
    maxLength: 7,
    mobilePrefixes: ["6"],
    hint: "Belize mobile / WhatsApp (e.g. 612-3456).",
    example: "612-3456",
    displayGroups: [3, 4],
  },
  "+55": {
    minLength: 11,
    maxLength: 11,
    mobileSubscriberAfterArea: { areaCodeLength: 2, prefixes: ["6", "7", "8", "9"] },
    hint: "Brazil mobile (e.g. 11-98765-4321).",
    example: "11-98765-4321",
    displayGroups: [2, 5, 4],
  },
  "+56": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["9"],
    hint: "Chile mobile (e.g. 912-345-678).",
    example: "912-345-678",
    displayGroups: [3, 3, 3],
  },
  "+86": {
    minLength: 11,
    maxLength: 11,
    mobilePrefixes: ["13", "14", "15", "16", "17", "18", "19"],
    hint: "China mobile (e.g. 138-1234-5678).",
    example: "138-1234-5678",
    displayGroups: [3, 4, 4],
  },
  "+57": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: ["3"],
    hint: "Colombia mobile (e.g. 300-123-4567).",
    example: "300-123-4567",
    displayGroups: [3, 3, 4],
  },
  "+506": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["5", "6", "7", "8"],
    hint: "Costa Rica mobile (e.g. 8312-3456).",
    example: "8312-3456",
    displayGroups: [4, 4],
  },
  "+53": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["5"],
    hint: "Cuba mobile (e.g. 5123-4567).",
    example: "5123-4567",
    displayGroups: [4, 4],
  },
  "+593": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["8", "9"],
    hint: "Ecuador mobile (e.g. 991-234-567).",
    example: "991-234-567",
    displayGroups: [3, 3, 3],
  },
  "+503": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["6", "7"],
    hint: "El Salvador mobile (e.g. 7012-3456).",
    example: "7012-3456",
    displayGroups: [4, 4],
  },
  "+971": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["50", "52", "54", "55", "56", "58"],
    hint: "UAE mobile — omit the leading 0 (e.g. 50-123-4567).",
    example: "50-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+33": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["6", "7"],
    hint: "France mobile — omit the leading 0 (e.g. 6-12-34-56-78).",
    example: "6-12-34-56-78",
    displayGroups: [1, 2, 2, 2, 2],
  },
  "+49": {
    minLength: 10,
    maxLength: 11,
    mobilePrefixes: ["15", "16", "17"],
    hint: "Germany mobile — omit the leading 0 (e.g. 151-2345-6789).",
    example: "151-2345-6789",
    displayGroups: [3, 4, 4],
  },
  "+502": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["4", "5"],
    hint: "Guatemala mobile (e.g. 5123-4567).",
    example: "5123-4567",
    displayGroups: [4, 4],
  },
  "+852": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["4", "5", "6", "7", "9"],
    hint: "Hong Kong mobile (e.g. 9123-4567).",
    example: "9123-4567",
    displayGroups: [4, 4],
  },
  "+504": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["3", "8", "9"],
    hint: "Honduras mobile (e.g. 9123-4567).",
    example: "9123-4567",
    displayGroups: [4, 4],
  },
  "+91": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: ["6", "7", "8", "9"],
    hint: "India mobile — omit the leading 0 (e.g. 98765-43210).",
    example: "98765-43210",
    displayGroups: [5, 5],
  },
  "+353": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["82", "83", "85", "86", "87", "89"],
    hint: "Ireland mobile — omit the leading 0 (e.g. 85-123-4567).",
    example: "85-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+39": {
    minLength: 9,
    maxLength: 10,
    mobilePrefixes: ["3"],
    hint: "Italy mobile (e.g. 312-345-6789).",
    example: "312-345-6789",
    displayGroups: [3, 3, 4],
  },
  "+1876": {
    minLength: 7,
    maxLength: 7,
    mobilePrefixes: NANP_LEADING_DIGITS,
    hint: "Jamaica mobile after +1 876 (e.g. 210-1234).",
    example: "210-1234",
    displayGroups: [3, 4],
  },
  "+81": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: ["70", "80", "90"],
    hint: "Japan mobile — omit the leading 0 (e.g. 90-1234-5678).",
    example: "90-1234-5678",
    displayGroups: [2, 4, 4],
  },
  "+52": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: NANP_LEADING_DIGITS,
    hint: "Mexico mobile (e.g. 55-1234-5678).",
    example: "55-1234-5678",
    displayGroups: [2, 4, 4],
  },
  "+31": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["6"],
    hint: "Netherlands mobile — omit the leading 0 (e.g. 6-1234-5678).",
    example: "6-1234-5678",
    displayGroups: [1, 4, 4],
  },
  "+64": {
    minLength: 8,
    maxLength: 10,
    mobilePrefixes: ["20", "21", "22", "27", "28", "29"],
    hint: "New Zealand mobile — omit the leading 0 (e.g. 21-123-4567).",
    example: "21-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+234": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: ["7", "8", "9"],
    hint: "Nigeria mobile — omit the leading 0 (e.g. 801-234-5678).",
    example: "801-234-5678",
    displayGroups: [3, 3, 4],
  },
  "+505": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["8"],
    hint: "Nicaragua mobile (e.g. 8123-4567).",
    example: "8123-4567",
    displayGroups: [4, 4],
  },
  "+507": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["6"],
    hint: "Panama mobile (e.g. 6123-4567).",
    example: "6123-4567",
    displayGroups: [4, 4],
  },
  "+63": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: ["9"],
    hint: "Philippines mobile (e.g. 917-123-4567).",
    example: "917-123-4567",
    displayGroups: [3, 3, 4],
  },
  "+51": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["9"],
    hint: "Peru mobile (e.g. 912-345-678).",
    example: "912-345-678",
    displayGroups: [3, 3, 3],
  },
  "+966": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["50", "51", "53", "54", "55", "56", "57", "58", "59"],
    hint: "Saudi Arabia mobile — omit the leading 0 (e.g. 512-345-678).",
    example: "512-345-678",
    displayGroups: [3, 3, 3],
  },
  "+65": {
    minLength: 8,
    maxLength: 8,
    mobilePrefixes: ["8", "9"],
    hint: "Singapore mobile (e.g. 8123-4567).",
    example: "8123-4567",
    displayGroups: [4, 4],
  },
  "+27": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["6", "7", "8"],
    hint: "South Africa mobile — omit the leading 0 (e.g. 82-123-4567).",
    example: "82-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+82": {
    minLength: 9,
    maxLength: 10,
    mobilePrefixes: ["10", "11", "16", "17", "18", "19"],
    hint: "South Korea mobile — omit the leading 0 (e.g. 10-1234-5678).",
    example: "10-1234-5678",
    displayGroups: [2, 4, 4],
  },
  "+34": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["6", "7"],
    hint: "Spain mobile (e.g. 612-345-678).",
    example: "612-345-678",
    displayGroups: [3, 3, 3],
  },
  "+46": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["70", "72", "73", "76", "79"],
    hint: "Sweden mobile — omit the leading 0 (e.g. 70-123-4567).",
    example: "70-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+41": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["74", "75", "76", "77", "78", "79"],
    hint: "Switzerland mobile — omit the leading 0 (e.g. 79-123-4567).",
    example: "79-123-4567",
    displayGroups: [2, 3, 4],
  },
  "+886": {
    minLength: 9,
    maxLength: 9,
    mobilePrefixes: ["9"],
    hint: "Taiwan mobile (e.g. 912-345-678).",
    example: "912-345-678",
    displayGroups: [3, 3, 3],
  },
  "+1868": {
    minLength: 7,
    maxLength: 7,
    mobilePrefixes: NANP_LEADING_DIGITS,
    hint: "Trinidad and Tobago mobile after +1 868 (e.g. 620-1234).",
    example: "620-1234",
    displayGroups: [3, 4],
  },
  "+1": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: NANP_LEADING_DIGITS,
    hint: "US / Canada mobile (e.g. 202-555-0123).",
    example: "202-555-0123",
    displayGroups: [3, 3, 4],
  },
  "+44": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: UK_MOBILE_PREFIXES,
    hint: "UK mobile — omit the leading 0 (e.g. 7400-123456).",
    example: "7400-123456",
    displayGroups: [4, 6],
  },
  "+58": {
    minLength: 10,
    maxLength: 10,
    mobilePrefixes: ["412", "414", "416", "424", "426"],
    hint: "Venezuela mobile (e.g. 412-123-4567).",
    example: "412-123-4567",
    displayGroups: [3, 3, 4],
  },
};

const DEFAULT_PHONE_RULE: PhoneNumberRule = {
  minLength: 7,
  maxLength: 15,
  hint: "Enter your mobile / WhatsApp number.",
  example: "123-4567",
  displayGroups: [3, 4],
};

/** Sorted alphabetically by country name for easier lookup. */
export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { id: "+54", code: "+54", region: "AR", country: "Argentina", label: "Argentina (+54)" },
  { id: "+61", code: "+61", region: "AU", country: "Australia", label: "Australia (+61)" },
  { id: "+1242", code: "+1242", region: "BS", country: "Bahamas", label: "Bahamas (+1 242)" },
  { id: "+1246", code: "+1246", region: "BB", country: "Barbados", label: "Barbados (+1 246)" },
  { id: "+501", code: "+501", region: "BZ", country: "Belize", label: "Belize (+501)" },
  { id: "+55", code: "+55", region: "BR", country: "Brazil", label: "Brazil (+55)" },
  { id: "+1-CA", code: "+1", region: "CA", country: "Canada", label: "Canada (+1)" },
  { id: "+56", code: "+56", region: "CL", country: "Chile", label: "Chile (+56)" },
  { id: "+86", code: "+86", region: "CN", country: "China", label: "China (+86)" },
  { id: "+57", code: "+57", region: "CO", country: "Colombia", label: "Colombia (+57)" },
  { id: "+506", code: "+506", region: "CR", country: "Costa Rica", label: "Costa Rica (+506)" },
  { id: "+53", code: "+53", region: "CU", country: "Cuba", label: "Cuba (+53)" },
  { id: "+593", code: "+593", region: "EC", country: "Ecuador", label: "Ecuador (+593)" },
  { id: "+503", code: "+503", region: "SV", country: "El Salvador", label: "El Salvador (+503)" },
  { id: "+971", code: "+971", region: "AE", country: "United Arab Emirates", label: "United Arab Emirates (+971)" },
  { id: "+33", code: "+33", region: "FR", country: "France", label: "France (+33)" },
  { id: "+49", code: "+49", region: "DE", country: "Germany", label: "Germany (+49)" },
  { id: "+502", code: "+502", region: "GT", country: "Guatemala", label: "Guatemala (+502)" },
  { id: "+852", code: "+852", region: "HK", country: "Hong Kong", label: "Hong Kong (+852)" },
  { id: "+504", code: "+504", region: "HN", country: "Honduras", label: "Honduras (+504)" },
  { id: "+91", code: "+91", region: "IN", country: "India", label: "India (+91)" },
  { id: "+353", code: "+353", region: "IE", country: "Ireland", label: "Ireland (+353)" },
  { id: "+39", code: "+39", region: "IT", country: "Italy", label: "Italy (+39)" },
  { id: "+1876", code: "+1876", region: "JM", country: "Jamaica", label: "Jamaica (+1 876)" },
  { id: "+81", code: "+81", region: "JP", country: "Japan", label: "Japan (+81)" },
  { id: "+52", code: "+52", region: "MX", country: "Mexico", label: "Mexico (+52)" },
  { id: "+31", code: "+31", region: "NL", country: "Netherlands", label: "Netherlands (+31)" },
  { id: "+64", code: "+64", region: "NZ", country: "New Zealand", label: "New Zealand (+64)" },
  { id: "+234", code: "+234", region: "NG", country: "Nigeria", label: "Nigeria (+234)" },
  { id: "+505", code: "+505", region: "NI", country: "Nicaragua", label: "Nicaragua (+505)" },
  { id: "+507", code: "+507", region: "PA", country: "Panama", label: "Panama (+507)" },
  { id: "+63", code: "+63", region: "PH", country: "Philippines", label: "Philippines (+63)" },
  { id: "+51", code: "+51", region: "PE", country: "Peru", label: "Peru (+51)" },
  { id: "+966", code: "+966", region: "SA", country: "Saudi Arabia", label: "Saudi Arabia (+966)" },
  { id: "+65", code: "+65", region: "SG", country: "Singapore", label: "Singapore (+65)" },
  { id: "+27", code: "+27", region: "ZA", country: "South Africa", label: "South Africa (+27)" },
  { id: "+82", code: "+82", region: "KR", country: "South Korea", label: "South Korea (+82)" },
  { id: "+34", code: "+34", region: "ES", country: "Spain", label: "Spain (+34)" },
  { id: "+46", code: "+46", region: "SE", country: "Sweden", label: "Sweden (+46)" },
  { id: "+41", code: "+41", region: "CH", country: "Switzerland", label: "Switzerland (+41)" },
  { id: "+886", code: "+886", region: "TW", country: "Taiwan", label: "Taiwan (+886)" },
  { id: "+1868", code: "+1868", region: "TT", country: "Trinidad and Tobago", label: "Trinidad and Tobago (+1 868)" },
  { id: "+1", code: "+1", region: "US", country: "United States", label: "United States (+1)" },
  { id: "+44", code: "+44", region: "GB", country: "United Kingdom", label: "United Kingdom (+44)" },
  { id: "+58", code: "+58", region: "VE", country: "Venezuela", label: "Venezuela (+58)" },
];

const MOBILE_NUMBER_TYPES = new Set(["MOBILE", "FIXED_LINE_OR_MOBILE"]);

export function findPhoneCountryEntry(countryCodeOrId: string): PhoneCountryCode | undefined {
  return (
    PHONE_COUNTRY_CODES.find((entry) => entry.id === countryCodeOrId) ??
    PHONE_COUNTRY_CODES.find((entry) => entry.code === countryCodeOrId)
  );
}

/** Resolve a select id or dial code to the E.164 dialing code used in stored numbers. */
export function resolvePhoneDialCode(countryCodeOrId: string): string {
  return findPhoneCountryEntry(countryCodeOrId)?.code ?? countryCodeOrId;
}

export function getPhoneNumberRule(countryCodeOrId: string): PhoneNumberRule {
  return PHONE_NUMBER_RULES[resolvePhoneDialCode(countryCodeOrId)] ?? DEFAULT_PHONE_RULE;
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
  return Boolean(findPhoneCountryEntry(code));
}

export function getPhoneCountryLabel(countryCodeOrId: string): string {
  return findPhoneCountryEntry(countryCodeOrId)?.country ?? "selected country";
}

/** Build E.164 from our dial-code selection + local national digits. */
export function toE164PhoneNumber(countryCodeOrId: string, localDigits: string): string {
  const dialCode = resolvePhoneDialCode(countryCodeOrId);
  const dialDigits = dialCode.replace(/\D/g, "");
  const significant = toSignificantNationalDigits(countryCodeOrId, localDigits);
  return `+${dialDigits}${significant}`;
}

/** Digits used for E.164 / libphonenumber. */
export function toSignificantNationalDigits(_countryCodeOrId: string, localDigits: string): string {
  return String(localDigits || "").replace(/\D/g, "");
}

function formatDigitGroups(digits: string, groups: readonly number[]): string {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "";
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

/** Format national digits with hyphens using the country display groups. */
export function formatPhoneLocalDisplay(digits: string, countryCodeOrId: string): string {
  return formatDigitGroups(digits, getPhoneNumberRule(countryCodeOrId).displayGroups);
}

function localDigitsFromParsed(parsed: PhoneNumber, entry: PhoneCountryCode): string {
  const national = parsed.nationalNumber;
  const dialDigits = entry.code.replace(/\D/g, "");
  // Caribbean-style entries store NPA in the dial code (+1242) and only 7 local digits in the field.
  if (dialDigits.startsWith("1") && dialDigits.length === 4) {
    const npa = dialDigits.slice(1);
    if (national.startsWith(npa)) return national.slice(npa.length);
  }
  return national;
}

/**
 * Split a stored phone string into dropdown id + local digits.
 * Prefers libphonenumber parsing so US vs Canada (and NANP territories) resolve correctly.
 */
export function splitStoredPhoneNumber(phone: string): {
  phoneCountryCode: string;
  phoneLocalNumber: string;
} {
  const value = String(phone || "").trim();
  if (!value) {
    return { phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE, phoneLocalNumber: "" };
  }

  const compact = value.startsWith("+") ? value.replace(/[^\d+]/g, "") : value.replace(/\D/g, "");
  const parsed = parsePhoneNumberFromString(compact.startsWith("+") ? compact : `+${compact}`);
  if (parsed?.country) {
    const entry =
      PHONE_COUNTRY_CODES.find((item) => item.region === parsed.country) ??
      findPhoneCountryEntry(`+${parsed.countryCallingCode}`);
    if (entry) {
      return {
        phoneCountryCode: entry.id,
        phoneLocalNumber: localDigitsFromParsed(parsed, entry),
      };
    }
  }

  const international = value.match(/^\+(\d{1,4})\s*(.+)$/);
  if (international) {
    const code = `+${international[1]}`;
    const entry = findPhoneCountryEntry(code);
    const local = international[2].replace(/\D/g, "");
    return {
      phoneCountryCode: entry?.id ?? code,
      phoneLocalNumber: local,
    };
  }

  return {
    phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
    phoneLocalNumber: value.replace(/\D/g, ""),
  };
}

function invalidMobileError(country: string): string {
  return `Please enter a valid ${country} mobile / WhatsApp number.`;
}

/** Validate national digits for a country code. Empty input is allowed (optional field). */
export function validateNationalPhoneNumber(
  countryCodeOrId: string,
  localDigits: string,
  options?: { soft?: boolean }
): string | null {
  const digits = String(localDigits || "").replace(/\D/g, "");
  if (!digits) return null;

  const entry = findPhoneCountryEntry(countryCodeOrId);
  if (!entry) {
    return "Please select a valid country code.";
  }

  const rule = getPhoneNumberRule(countryCodeOrId);
  const invalid = invalidMobileError(entry.country);

  // While typing, don't show inline length errors — locals know their format.
  if (digits.length < rule.minLength) {
    return options?.soft ? null : invalid;
  }

  if (digits.length > rule.maxLength) {
    return invalid;
  }

  const significant = toSignificantNationalDigits(entry.id, digits);
  const parsed = parsePhoneNumberFromString(toE164PhoneNumber(entry.id, digits), entry.region);
  if (!parsed || !parsed.isValid()) {
    return invalid;
  }

  if (parsed.country && parsed.country !== entry.region) {
    return invalid;
  }

  const numberType = parsed.getType();
  if (numberType && !MOBILE_NUMBER_TYPES.has(numberType)) {
    return invalid;
  }

  if (rule.mobilePrefixes?.length) {
    const ok = rule.mobilePrefixes.some((prefix) => significant.startsWith(prefix));
    if (!ok) return invalid;
  }

  if (rule.mobileSubscriberAfterArea) {
    const { areaCodeLength, prefixes } = rule.mobileSubscriberAfterArea;
    const subscriber = significant.slice(areaCodeLength);
    const ok = prefixes.some((prefix) => subscriber.startsWith(prefix));
    if (!ok) return invalid;
  }

  return null;
}
