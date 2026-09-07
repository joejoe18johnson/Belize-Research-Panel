export interface PhoneCountryCode {
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
  /** Placeholder example (digits only). */
  example: string;
}

export const DEFAULT_PHONE_COUNTRY_CODE = "+501";

/**
 * National (local) number rules by dialing code.
 * Lengths exclude the country code — what the registrant types in the local field.
 */
export const PHONE_NUMBER_RULES: Record<string, PhoneNumberRule> = {
  "+54": { minLength: 10, maxLength: 10, hint: "Argentina numbers use 10 digits.", example: "9112345678" },
  "+61": { minLength: 9, maxLength: 9, hint: "Australia numbers use 9 digits (without the leading 0).", example: "412345678" },
  "+1242": { minLength: 7, maxLength: 7, hint: "Bahamas numbers use 7 digits after +1 242.", example: "3591234" },
  "+1246": { minLength: 7, maxLength: 7, hint: "Barbados numbers use 7 digits after +1 246.", example: "4301234" },
  "+501": {
    minLength: 7,
    maxLength: 7,
    startsWith: ["6"],
    hint: "Belize mobile / WhatsApp numbers use exactly 7 digits and start with 6.",
    example: "6123456",
  },
  "+55": { minLength: 10, maxLength: 11, hint: "Brazil numbers use 10–11 digits (including area code).", example: "11987654321" },
  "+56": { minLength: 9, maxLength: 9, hint: "Chile numbers use 9 digits.", example: "912345678" },
  "+86": { minLength: 11, maxLength: 11, hint: "China mobile numbers use 11 digits.", example: "13812345678" },
  "+57": { minLength: 10, maxLength: 10, hint: "Colombia numbers use 10 digits.", example: "3001234567" },
  "+506": { minLength: 8, maxLength: 8, hint: "Costa Rica numbers use 8 digits.", example: "83123456" },
  "+53": { minLength: 8, maxLength: 8, hint: "Cuba numbers use 8 digits.", example: "51234567" },
  "+593": { minLength: 9, maxLength: 9, hint: "Ecuador numbers use 9 digits.", example: "991234567" },
  "+503": { minLength: 8, maxLength: 8, hint: "El Salvador numbers use 8 digits.", example: "70123456" },
  "+971": { minLength: 9, maxLength: 9, hint: "UAE numbers use 9 digits (without the leading 0).", example: "501234567" },
  "+33": { minLength: 9, maxLength: 9, hint: "France numbers use 9 digits (without the leading 0).", example: "612345678" },
  "+49": { minLength: 10, maxLength: 11, hint: "Germany numbers usually use 10–11 digits (without the leading 0).", example: "15123456789" },
  "+502": { minLength: 8, maxLength: 8, hint: "Guatemala numbers use 8 digits.", example: "51234567" },
  "+852": { minLength: 8, maxLength: 8, hint: "Hong Kong numbers use 8 digits.", example: "91234567" },
  "+504": { minLength: 8, maxLength: 8, hint: "Honduras numbers use 8 digits.", example: "91234567" },
  "+91": { minLength: 10, maxLength: 10, hint: "India mobile numbers use 10 digits.", example: "9876543210" },
  "+353": { minLength: 9, maxLength: 9, hint: "Ireland numbers use 9 digits (without the leading 0).", example: "851234567" },
  "+39": { minLength: 9, maxLength: 10, hint: "Italy mobile numbers usually use 9–10 digits.", example: "3123456789" },
  "+1876": { minLength: 7, maxLength: 7, hint: "Jamaica numbers use 7 digits after +1 876.", example: "2101234" },
  "+81": { minLength: 10, maxLength: 10, hint: "Japan mobile numbers use 10 digits (without the leading 0).", example: "9012345678" },
  "+52": { minLength: 10, maxLength: 10, hint: "Mexico numbers use 10 digits.", example: "5512345678" },
  "+31": { minLength: 9, maxLength: 9, hint: "Netherlands numbers use 9 digits (without the leading 0).", example: "612345678" },
  "+64": { minLength: 8, maxLength: 10, hint: "New Zealand numbers usually use 8–10 digits (without the leading 0).", example: "211234567" },
  "+234": { minLength: 10, maxLength: 10, hint: "Nigeria numbers use 10 digits (without the leading 0).", example: "8012345678" },
  "+505": { minLength: 8, maxLength: 8, hint: "Nicaragua numbers use 8 digits.", example: "81234567" },
  "+507": { minLength: 8, maxLength: 8, hint: "Panama numbers use 8 digits.", example: "61234567" },
  "+63": { minLength: 10, maxLength: 10, hint: "Philippines mobile numbers use 10 digits.", example: "9171234567" },
  "+51": { minLength: 9, maxLength: 9, hint: "Peru numbers use 9 digits.", example: "912345678" },
  "+966": { minLength: 9, maxLength: 9, hint: "Saudi Arabia numbers use 9 digits (without the leading 0).", example: "512345678" },
  "+65": { minLength: 8, maxLength: 8, hint: "Singapore numbers use 8 digits.", example: "81234567" },
  "+27": { minLength: 9, maxLength: 9, hint: "South Africa numbers use 9 digits (without the leading 0).", example: "821234567" },
  "+82": { minLength: 9, maxLength: 10, hint: "South Korea numbers usually use 9–10 digits (without the leading 0).", example: "1012345678" },
  "+34": { minLength: 9, maxLength: 9, hint: "Spain numbers use 9 digits.", example: "612345678" },
  "+46": { minLength: 9, maxLength: 9, hint: "Sweden numbers use 9 digits (without the leading 0).", example: "701234567" },
  "+41": { minLength: 9, maxLength: 9, hint: "Switzerland numbers use 9 digits (without the leading 0).", example: "791234567" },
  "+886": { minLength: 9, maxLength: 9, hint: "Taiwan mobile numbers use 9 digits.", example: "912345678" },
  "+1868": { minLength: 7, maxLength: 7, hint: "Trinidad and Tobago numbers use 7 digits after +1 868.", example: "6201234" },
  "+1": { minLength: 10, maxLength: 10, hint: "US / Canada numbers use 10 digits (area code + number).", example: "2025550123" },
  "+44": { minLength: 10, maxLength: 10, hint: "UK numbers use 10 digits (without the leading 0).", example: "7400123456" },
  "+58": { minLength: 10, maxLength: 10, hint: "Venezuela numbers use 10 digits.", example: "4121234567" },
};

const DEFAULT_PHONE_RULE: PhoneNumberRule = {
  minLength: 7,
  maxLength: 15,
  hint: "Enter the phone number without the country code.",
  example: "1234567",
};

/** Sorted alphabetically by country name for easier lookup. */
export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { code: "+54", country: "Argentina", label: "Argentina (+54)" },
  { code: "+61", country: "Australia", label: "Australia (+61)" },
  { code: "+1242", country: "Bahamas", label: "Bahamas (+1 242)" },
  { code: "+1246", country: "Barbados", label: "Barbados (+1 246)" },
  { code: "+501", country: "Belize", label: "Belize (+501)" },
  { code: "+55", country: "Brazil", label: "Brazil (+55)" },
  { code: "+56", country: "Chile", label: "Chile (+56)" },
  { code: "+86", country: "China", label: "China (+86)" },
  { code: "+57", country: "Colombia", label: "Colombia (+57)" },
  { code: "+506", country: "Costa Rica", label: "Costa Rica (+506)" },
  { code: "+53", country: "Cuba", label: "Cuba (+53)" },
  { code: "+593", country: "Ecuador", label: "Ecuador (+593)" },
  { code: "+503", country: "El Salvador", label: "El Salvador (+503)" },
  { code: "+971", country: "United Arab Emirates", label: "United Arab Emirates (+971)" },
  { code: "+33", country: "France", label: "France (+33)" },
  { code: "+49", country: "Germany", label: "Germany (+49)" },
  { code: "+502", country: "Guatemala", label: "Guatemala (+502)" },
  { code: "+852", country: "Hong Kong", label: "Hong Kong (+852)" },
  { code: "+504", country: "Honduras", label: "Honduras (+504)" },
  { code: "+91", country: "India", label: "India (+91)" },
  { code: "+353", country: "Ireland", label: "Ireland (+353)" },
  { code: "+39", country: "Italy", label: "Italy (+39)" },
  { code: "+1876", country: "Jamaica", label: "Jamaica (+1 876)" },
  { code: "+81", country: "Japan", label: "Japan (+81)" },
  { code: "+52", country: "Mexico", label: "Mexico (+52)" },
  { code: "+31", country: "Netherlands", label: "Netherlands (+31)" },
  { code: "+64", country: "New Zealand", label: "New Zealand (+64)" },
  { code: "+234", country: "Nigeria", label: "Nigeria (+234)" },
  { code: "+505", country: "Nicaragua", label: "Nicaragua (+505)" },
  { code: "+507", country: "Panama", label: "Panama (+507)" },
  { code: "+63", country: "Philippines", label: "Philippines (+63)" },
  { code: "+51", country: "Peru", label: "Peru (+51)" },
  { code: "+966", country: "Saudi Arabia", label: "Saudi Arabia (+966)" },
  { code: "+65", country: "Singapore", label: "Singapore (+65)" },
  { code: "+27", country: "South Africa", label: "South Africa (+27)" },
  { code: "+82", country: "South Korea", label: "South Korea (+82)" },
  { code: "+34", country: "Spain", label: "Spain (+34)" },
  { code: "+46", country: "Sweden", label: "Sweden (+46)" },
  { code: "+41", country: "Switzerland", label: "Switzerland (+41)" },
  { code: "+886", country: "Taiwan", label: "Taiwan (+886)" },
  { code: "+1868", country: "Trinidad and Tobago", label: "Trinidad and Tobago (+1 868)" },
  { code: "+1", country: "United States", label: "United States / Canada (+1)" },
  { code: "+44", country: "United Kingdom", label: "United Kingdom (+44)" },
  { code: "+58", country: "Venezuela", label: "Venezuela (+58)" },
];

const COUNTRY_ALIASES: Record<string, string> = {
  USA: "United States",
  "United States of America": "United States",
  Canada: "United States",
  UK: "United Kingdom",
  "Great Britain": "United Kingdom",
  "Trinidad & Tobago": "Trinidad and Tobago",
};

export function phoneCountryCodeForCountry(country: string): string | null {
  const normalized = COUNTRY_ALIASES[country.trim()] ?? country.trim();
  const match = PHONE_COUNTRY_CODES.find(
    (entry) => entry.country.toLowerCase() === normalized.toLowerCase()
  );
  return match?.code ?? null;
}

export function isValidPhoneCountryCode(code: string): boolean {
  return PHONE_COUNTRY_CODES.some((entry) => entry.code === code);
}

export function getPhoneNumberRule(countryCode: string): PhoneNumberRule {
  return PHONE_NUMBER_RULES[countryCode] ?? DEFAULT_PHONE_RULE;
}

export function getPhoneCountryLabel(countryCode: string): string {
  return PHONE_COUNTRY_CODES.find((entry) => entry.code === countryCode)?.country ?? "selected country";
}

/** Validate national digits for a country code. Empty input is allowed (optional field). */
export function validateNationalPhoneNumber(countryCode: string, localDigits: string): string | null {
  const digits = String(localDigits || "").replace(/\D/g, "");
  if (!digits) return null;
  if (!isValidPhoneCountryCode(countryCode)) {
    return "Please select a valid country code.";
  }

  const rule = getPhoneNumberRule(countryCode);
  const country = getPhoneCountryLabel(countryCode);
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
      if (countryCode === "+501") {
        return "Belize mobile / WhatsApp numbers must start with 6 (7 digits total, e.g. 6123456).";
      }
      const prefixes = rule.startsWith.join(" or ");
      return `${country} phone numbers must start with ${prefixes}.`;
    }
  }

  return null;
}
