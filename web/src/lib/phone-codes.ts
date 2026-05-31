export interface PhoneCountryCode {
  code: string;
  country: string;
  label: string;
}

export const DEFAULT_PHONE_COUNTRY_CODE = "+501";

/** Common codes for Belize and Belizeans abroad */
export const PHONE_COUNTRY_CODES: PhoneCountryCode[] = [
  { code: "+501", country: "Belize", label: "Belize (+501)" },
  { code: "+1", country: "United States", label: "United States / Canada (+1)" },
  { code: "+52", country: "Mexico", label: "Mexico (+52)" },
  { code: "+502", country: "Guatemala", label: "Guatemala (+502)" },
  { code: "+503", country: "El Salvador", label: "El Salvador (+503)" },
  { code: "+504", country: "Honduras", label: "Honduras (+504)" },
  { code: "+505", country: "Nicaragua", label: "Nicaragua (+505)" },
  { code: "+506", country: "Costa Rica", label: "Costa Rica (+506)" },
  { code: "+507", country: "Panama", label: "Panama (+507)" },
  { code: "+53", country: "Cuba", label: "Cuba (+53)" },
  { code: "+55", country: "Brazil", label: "Brazil (+55)" },
  { code: "+57", country: "Colombia", label: "Colombia (+57)" },
  { code: "+58", country: "Venezuela", label: "Venezuela (+58)" },
  { code: "+51", country: "Peru", label: "Peru (+51)" },
  { code: "+593", country: "Ecuador", label: "Ecuador (+593)" },
  { code: "+54", country: "Argentina", label: "Argentina (+54)" },
  { code: "+56", country: "Chile", label: "Chile (+56)" },
  { code: "+1876", country: "Jamaica", label: "Jamaica (+1 876)" },
  { code: "+1868", country: "Trinidad and Tobago", label: "Trinidad and Tobago (+1 868)" },
  { code: "+1246", country: "Barbados", label: "Barbados (+1 246)" },
  { code: "+1242", country: "Bahamas", label: "Bahamas (+1 242)" },
  { code: "+44", country: "United Kingdom", label: "United Kingdom (+44)" },
  { code: "+353", country: "Ireland", label: "Ireland (+353)" },
  { code: "+33", country: "France", label: "France (+33)" },
  { code: "+49", country: "Germany", label: "Germany (+49)" },
  { code: "+31", country: "Netherlands", label: "Netherlands (+31)" },
  { code: "+34", country: "Spain", label: "Spain (+34)" },
  { code: "+39", country: "Italy", label: "Italy (+39)" },
  { code: "+41", country: "Switzerland", label: "Switzerland (+41)" },
  { code: "+46", country: "Sweden", label: "Sweden (+46)" },
  { code: "+61", country: "Australia", label: "Australia (+61)" },
  { code: "+64", country: "New Zealand", label: "New Zealand (+64)" },
  { code: "+86", country: "China", label: "China (+86)" },
  { code: "+852", country: "Hong Kong", label: "Hong Kong (+852)" },
  { code: "+886", country: "Taiwan", label: "Taiwan (+886)" },
  { code: "+81", country: "Japan", label: "Japan (+81)" },
  { code: "+82", country: "South Korea", label: "South Korea (+82)" },
  { code: "+91", country: "India", label: "India (+91)" },
  { code: "+63", country: "Philippines", label: "Philippines (+63)" },
  { code: "+65", country: "Singapore", label: "Singapore (+65)" },
  { code: "+971", country: "United Arab Emirates", label: "United Arab Emirates (+971)" },
  { code: "+966", country: "Saudi Arabia", label: "Saudi Arabia (+966)" },
  { code: "+27", country: "South Africa", label: "South Africa (+27)" },
  { code: "+234", country: "Nigeria", label: "Nigeria (+234)" },
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
