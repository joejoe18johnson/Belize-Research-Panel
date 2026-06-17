import { cleanText } from "./validation";

export type SuspiciousEmailRiskLevel = "medium" | "high";

export interface SuspiciousEmailSignal {
  id: string;
  label: string;
  detail: string;
  weight: number;
}

export interface SuspiciousEmailAssessment {
  email: string;
  localPart: string;
  domain: string;
  riskScore: number;
  riskLevel: SuspiciousEmailRiskLevel | null;
  signals: SuspiciousEmailSignal[];
  suspicious: boolean;
  blockSignup: boolean;
}

export interface SuspiciousEmailContext {
  firstName?: string;
  lastName?: string;
}

const DISPOSABLE_DOMAINS = new Set(
  [
    "mailinator.com",
    "guerrillamail.com",
    "guerrillamail.net",
    "guerrillamail.org",
    "guerrillamailblock.com",
    "sharklasers.com",
    "grr.la",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net",
    "tempmail.com",
    "temp-mail.org",
    "temp-mail.io",
    "throwaway.email",
    "dispostable.com",
    "mailnesia.com",
    "fakeinbox.com",
    "trashmail.com",
    "trashmail.me",
    "getnada.com",
    "maildrop.cc",
    "mohmal.com",
    "emailondeck.com",
    "mintemail.com",
    "mytemp.email",
    "10minutemail.com",
    "10minutemail.net",
    "dropmail.me",
    "spam4.me",
    "mailcatch.com",
    "mailnull.com",
    "discard.email",
    "harakirimail.com",
    "inboxkitten.com",
    "tmpmail.net",
    "tmpmail.org",
    "burnermail.io",
    "mailpoof.com",
    "fakemailgenerator.com",
    "crazymailing.com",
    "tempr.email",
    "emailfake.com",
    "generator.email",
  ].map((domain) => domain.toLowerCase())
);

const SUSPICIOUS_DOMAIN_KEYWORDS = [
  "tempmail",
  "temp-mail",
  "throwaway",
  "disposable",
  "fakeinbox",
  "trashmail",
  "guerrilla",
  "mailinator",
  "yopmail",
  "spam",
  "burner",
  "fakemail",
  "tmpmail",
  "maildrop",
];

const SUSPICIOUS_LOCAL_KEYWORDS = [
  "bot",
  "spam",
  "fake",
  "temp",
  "testuser",
  "throwaway",
  "disposable",
  "noreply",
  "no-reply",
];

const GENERIC_LOCAL_PARTS = new Set([
  "info",
  "contact",
  "admin",
  "support",
  "hello",
  "mail",
  "email",
  "user",
  "account",
]);

const SUSPICIOUS_TLDS = new Set(["xyz", "top", "click", "icu", "buzz", "rest", "surf", "gq", "tk", "ml", "cf", "ga"]);

function splitEmail(email: string): { localPart: string; domain: string } | null {
  const value = cleanText(email).toLowerCase();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return null;
  return {
    localPart: value.slice(0, at),
    domain: value.slice(at + 1),
  };
}

function stripPlusTag(localPart: string): string {
  const plus = localPart.indexOf("+");
  return plus >= 0 ? localPart.slice(0, plus) : localPart;
}

function consonantRatio(value: string): number {
  const letters = value.replace(/[^a-z]/gi, "");
  if (!letters) return 0;
  const consonants = letters.replace(/[aeiou]/gi, "").length;
  return consonants / letters.length;
}

function nameTokens(firstName?: string, lastName?: string): string[] {
  const tokens = `${cleanText(firstName)} ${cleanText(lastName)}`
    .toLowerCase()
    .split(/[\s,.-]+/)
    .map((part) => part.replace(/[^a-z0-9]/g, ""))
    .filter((part) => part.length >= 3);
  return [...new Set(tokens)];
}

function localMatchesName(localPart: string, firstName?: string, lastName?: string): boolean {
  const base = stripPlusTag(localPart).replace(/[^a-z0-9]/g, "");
  if (!base || GENERIC_LOCAL_PARTS.has(base)) return true;
  const tokens = nameTokens(firstName, lastName);
  if (tokens.length === 0) return true;
  return tokens.some((token) => base.includes(token) || token.includes(base));
}

export function assessSuspiciousEmail(
  email: string,
  context: SuspiciousEmailContext = {}
): SuspiciousEmailAssessment {
  const parts = splitEmail(email);
  if (!parts) {
    return {
      email: cleanText(email),
      localPart: "",
      domain: "",
      riskScore: 0,
      riskLevel: null,
      signals: [],
      suspicious: false,
      blockSignup: false,
    };
  }

  const { localPart, domain } = parts;
  const baseLocal = stripPlusTag(localPart);
  const signals: SuspiciousEmailSignal[] = [];

  const add = (id: string, label: string, detail: string, weight: number) => {
    signals.push({ id, label, detail, weight });
  };

  if (DISPOSABLE_DOMAINS.has(domain)) {
    add("disposable-domain", "Disposable email domain", `${domain} is a known throwaway email provider.`, 70);
  }

  for (const keyword of SUSPICIOUS_DOMAIN_KEYWORDS) {
    if (domain.includes(keyword)) {
      add("suspicious-domain-keyword", "Suspicious domain keyword", `Domain contains "${keyword}".`, 45);
      break;
    }
  }

  const tld = domain.split(".").pop() ?? "";
  if (SUSPICIOUS_TLDS.has(tld) && !domain.endsWith(".com.bz")) {
    add("suspicious-tld", "Uncommon top-level domain", `Uses .${tld}, which is common in throwaway or bot signups.`, 25);
  }

  if (/^[0-9]{8,}$/.test(baseLocal)) {
    add("numeric-local", "Numeric-only address", "Local part is only digits.", 50);
  }

  if (/^[a-f0-9]{20,}$/i.test(baseLocal)) {
    add("hex-local", "Random hex local part", "Looks like an auto-generated hexadecimal address.", 55);
  }

  if (baseLocal.length >= 18 && consonantRatio(baseLocal) >= 0.82 && !/\d/.test(baseLocal)) {
    add("random-string-local", "Random-looking local part", "Long local part with very few vowels.", 40);
  }

  if (/[0-9]{6,}/.test(baseLocal)) {
    add("long-digit-run", "Long number sequence", "Local part contains six or more digits in a row.", 30);
  }

  if ((baseLocal.match(/\./g) ?? []).length >= 3 || (baseLocal.match(/_/g) ?? []).length >= 3) {
    add("separator-spam", "Excessive separators", "Multiple dots or underscores in the local part.", 25);
  }

  if (localPart.includes("+") && localPart.split("+")[1]?.replace(/[^a-z0-9]/gi, "").length >= 8) {
    add("plus-tag", "Long plus-address tag", "Uses a long random-looking +tag alias.", 30);
  }

  for (const keyword of SUSPICIOUS_LOCAL_KEYWORDS) {
    if (baseLocal.includes(keyword)) {
      add("suspicious-local-keyword", "Suspicious local keyword", `Local part contains "${keyword}".`, 35);
      break;
    }
  }

  if (!localMatchesName(baseLocal, context.firstName, context.lastName)) {
    add(
      "name-mismatch",
      "Name does not match email",
      "Email local part does not resemble the panelist name on file.",
      20
    );
  }

  const riskScore = Math.min(100, signals.reduce((sum, signal) => sum + signal.weight, 0));
  const suspicious = riskScore >= 35;
  const blockSignup = signals.some((signal) =>
    ["disposable-domain", "hex-local", "numeric-local"].includes(signal.id)
  ) || riskScore >= 70;

  const riskLevel: SuspiciousEmailRiskLevel | null = !suspicious
    ? null
    : riskScore >= 55 || blockSignup
      ? "high"
      : "medium";

  return {
    email: cleanText(email).toLowerCase(),
    localPart,
    domain,
    riskScore,
    riskLevel,
    signals,
    suspicious,
    blockSignup,
  };
}

export function validateEmailForBotSignup(
  email: string,
  context: SuspiciousEmailContext = {}
): string | null {
  const assessment = assessSuspiciousEmail(email, context);
  if (!assessment.blockSignup) return null;

  const primary = assessment.signals[0];
  if (primary?.id === "disposable-domain") {
    return "Disposable or temporary email addresses cannot be used to join the panel.";
  }
  return "This email address looks automated or suspicious. Use a personal email you check regularly.";
}
