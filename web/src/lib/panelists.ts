import { createHash, randomUUID } from "crypto";
import { normalizeDobForComparison } from "./dob";
import { promises as fs } from "fs";
import path from "path";
import { PANELIST_COLUMNS } from "./constants";
import {
  calculateAge,
  cleanText,
  composePhoneNumber,
  getFullPhoneNumber,
  getRegistrationEmailForLogin,
  isRegisteredVoter,
  normalizePhoneForComparison,
  normalizeContactHandle,
  normalizeContactPlatform,
  titleCaseName,
} from "./validation";
import type { RegistrationFormData } from "./registration-types";
import type { ProfileUpdateFormData } from "./profile-update-types";

const DATA_DIR = path.join(process.cwd(), "data");
const PANELISTS_FILE = path.join(DATA_DIR, "panelists.csv");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export type PanelistRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function loadPanelists(): Promise<PanelistRow[]> {
  try {
    const content = await fs.readFile(PANELISTS_FILE, "utf-8");
    const lines = content.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });
      return row as PanelistRow;
    });
  } catch {
    return [];
  }
}

export async function findPanelistByEmail(email: string): Promise<PanelistRow | null> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return null;
  const rows = await loadPanelists();
  return (
    rows.find((row) => cleanText(row.email).toLowerCase() === normalized) ??
    null
  );
}

export async function updatePanelistEmail(oldEmail: string, newEmail: string): Promise<boolean> {
  const oldNorm = cleanText(oldEmail).toLowerCase();
  const newNorm = cleanText(newEmail).toLowerCase();
  if (!oldNorm || !newNorm) return false;

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === oldNorm);
  if (index < 0) return false;

  rows[index] = { ...rows[index], email: newNorm };
  await savePanelists(rows);
  return true;
}

export async function updatePanelistPhone(accountEmail: string, phone: string): Promise<boolean> {
  const normalized = cleanText(accountEmail).toLowerCase();
  if (!normalized) return false;

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === normalized);
  if (index < 0) return false;

  rows[index] = { ...rows[index], phone_whatsapp: cleanText(phone) };
  await savePanelists(rows);
  return true;
}

export async function updatePanelistCredentialsByEmail(
  accountEmail: string,
  passwordSalt: string,
  passwordHash: string
): Promise<boolean> {
  const normalized = cleanText(accountEmail).toLowerCase();
  if (!normalized) return false;

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === normalized);
  if (index < 0) return false;

  rows[index] = {
    ...rows[index],
    password_salt: passwordSalt,
    password_hash: passwordHash,
  };
  await savePanelists(rows);
  return true;
}

export async function updatePanelistAdminFields(
  accountEmail: string,
  updates: {
    verification_status?: string;
    status?: string;
    email?: string;
    phone_whatsapp?: string;
    district?: string;
    city_town_village?: string;
    constituency?: string;
    notes?: string;
    admin_email_approved?: string;
    admin_phone_approved?: string;
    admin_photo_id_approved?: string;
  }
): Promise<boolean> {
  const normalized = cleanText(accountEmail).toLowerCase();
  if (!normalized) return false;

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === normalized);
  if (index < 0) return false;

  rows[index] = {
    ...rows[index],
    ...Object.fromEntries(
      Object.entries(updates)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, cleanText(String(value))])
    ),
  };
  await savePanelists(rows);
  return true;
}

export async function savePanelists(rows: PanelistRow[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const headers = [...PANELIST_COLUMNS];
  const extraKeys = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!headers.includes(key as (typeof PANELIST_COLUMNS)[number])) {
        extraKeys.add(key);
      }
    });
  });
  const allHeaders = [...headers, ...Array.from(extraKeys)];
  const lines = [
    allHeaders.join(","),
    ...rows.map((row) => allHeaders.map((h) => escapeCsvValue(row[h] ?? "")).join(",")),
  ];
  await fs.writeFile(PANELISTS_FILE, lines.join("\n"), "utf-8");
}

export function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const usedSalt = salt ?? randomUUID().replace(/-/g, "");
  const hash = createHash("sha256").update(usedSalt + password).digest("hex");
  return { salt: usedSalt, hash };
}

export function usernameExists(rows: PanelistRow[], username: string): boolean {
  const target = cleanText(username).toLowerCase();
  return rows.some((row) => cleanText(row.username).toLowerCase() === target);
}

export function ensureUniqueUsername(rows: PanelistRow[], base: string): string {
  let candidate = cleanText(base);
  if (!usernameExists(rows, candidate)) return candidate;
  for (let n = 1; n < 1000; n++) {
    const suffix = String(n);
    candidate = `${base.slice(0, Math.max(4, 20 - suffix.length))}${suffix}`;
    if (!usernameExists(rows, candidate)) return candidate;
  }
  return `${base.slice(0, 12)}${Date.now().toString().slice(-6)}`;
}

export function duplicateCheck(
  rows: PanelistRow[],
  data: Pick<RegistrationFormData, "email" | "phoneCountryCode" | "phoneLocalNumber" | "firstName" | "lastName" | "dob" | "photoIdType">,
  photoIdLast4 = ""
): { hardDuplicate: boolean; possibleDuplicate: boolean } {
  let hardDuplicate = false;
  const possibleDuplicate = false;

  const emailNorm = cleanText(data.email).toLowerCase();
  const phoneNorm = normalizePhoneForComparison(getFullPhoneNumber(data));
  const firstNorm = cleanText(data.firstName).toLowerCase().replace(/\s+/g, " ").trim();
  const lastNorm = cleanText(data.lastName).toLowerCase().replace(/\s+/g, " ").trim();
  const dobNorm = normalizeDobForComparison(cleanText(data.dob));
  const idTypeNorm = cleanText(data.photoIdType).toLowerCase();
  const idLast4Norm = cleanText(photoIdLast4);

  for (const row of rows) {
    if (emailNorm && cleanText(row.email).toLowerCase() === emailNorm) hardDuplicate = true;
    if (phoneNorm && normalizePhoneForComparison(row.phone_whatsapp) === phoneNorm) hardDuplicate = true;
    if (
      firstNorm &&
      lastNorm &&
      dobNorm &&
      cleanText(row.first_name).toLowerCase().replace(/\s+/g, " ").trim() === firstNorm &&
      cleanText(row.last_name).toLowerCase().replace(/\s+/g, " ").trim() === lastNorm &&
      normalizeDobForComparison(cleanText(row.dob)) === dobNorm
    ) {
      hardDuplicate = true;
    }
    if (
      idTypeNorm &&
      idLast4Norm &&
      cleanText(row.photo_id_type).toLowerCase() === idTypeNorm &&
      cleanText(row.photo_id_last4) === idLast4Norm
    ) {
      hardDuplicate = true;
    }
  }

  return { hardDuplicate, possibleDuplicate };
}

export async function panelistHasUpload(
  username: string,
  prefix: "photo-id" | "residence-proof"
): Promise<boolean> {
  const file = await findPanelistUpload(username, prefix);
  return Boolean(file);
}

export async function findPanelistUpload(
  username: string,
  prefix: "photo-id" | "residence-proof"
): Promise<{ filename: string; absolutePath: string } | null> {
  const safeUsername = cleanText(username);
  if (!safeUsername) return null;

  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const matches = files.filter((file) => file.startsWith(`${prefix}-${safeUsername}`));
    if (matches.length === 0) return null;

    const ranked = await Promise.all(
      matches.map(async (filename) => {
        const absolutePath = path.join(UPLOADS_DIR, filename);
        const stat = await fs.stat(absolutePath);
        return { filename, absolutePath, mtimeMs: stat.mtimeMs };
      })
    );

    ranked.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const latest = ranked[0];
    return { filename: latest.filename, absolutePath: latest.absolutePath };
  } catch {
    return null;
  }
}

export async function saveUploadedFile(file: File, prefix: string): Promise<string> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const ext = path.extname(file.name) || ".bin";
  const filename = `${prefix}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return filename;
}

export async function registerPanelist(
  data: RegistrationFormData,
  credentials?: {
    username: string;
    passwordSalt: string;
    passwordHash: string;
    accountEmail: string;
  }
): Promise<{ verificationStatus: string }> {
  const rows = await loadPanelists();
  const registeredVoter = isRegisteredVoter(data.citizenshipStatus, data.votingStatus);
  const voterStatus = registeredVoter ? "Registered voter" : "Not applicable";
  const votingStatus =
    data.citizenshipStatus === "Citizen of Belize" ||
    data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize"
      ? data.votingStatus
      : data.citizenshipStatus === "Other resident of Belize"
        ? "No"
        : "Not registered to vote in Belize";

  const cityFinal =
    data.cityTownVillage === "Other" ? data.cityTownVillageOther : data.cityTownVillage;
  const otherPlatform =
    data.otherContactPlatform === "Other"
      ? data.otherContactPlatformCustom
      : data.otherContactPlatform;

  const { hardDuplicate, possibleDuplicate } = duplicateCheck(rows, data);
  if (hardDuplicate) {
    throw new Error("duplicate");
  }

  const { salt, hash } = credentials
    ? { salt: credentials.passwordSalt, hash: credentials.passwordHash }
    : hashPassword(data.password);
  const username = credentials
    ? ensureUniqueUsername(rows, credentials.username)
    : cleanText(data.username);
  const panelistEmail = credentials
    ? cleanText(credentials.accountEmail)
    : cleanText(getRegistrationEmailForLogin(data)) || cleanText(data.email);
  const verificationStatus = possibleDuplicate ? "Possible Duplicate" : "Pending";
  const now = new Date();
  const registrationDate = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  if (data.photoIdFile) {
    await saveUploadedFile(data.photoIdFile, `photo-id-${cleanText(username)}`);
  }
  if (data.proofOfBelizeResidenceFile) {
    await saveUploadedFile(data.proofOfBelizeResidenceFile, `residence-proof-${cleanText(username)}`);
  }

  const newRow: PanelistRow = {
    registration_date: registrationDate,
    first_name: titleCaseName(data.firstName),
    last_name: titleCaseName(data.lastName),
    dob: data.dob,
    age: String(calculateAge(data.dob)),
    citizenship_status: data.citizenshipStatus,
    commonwealth_country:
      data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize"
        ? cleanText(data.commonwealthCountry)
        : "",
    voting_status: votingStatus,
    voter_status: voterStatus,
    place_of_residence: data.placeOfResidence,
    district: data.placeOfResidence === "Abroad" ? "" : data.placeOfResidence,
    city_town_village: cleanText(cityFinal),
    country_if_abroad: data.countryIfAbroad,
    constituency: registeredVoter ? data.constituency : "",
    registered_ctv_area: registeredVoter ? cleanText(data.registeredCtvArea) : "",
    sex: data.sex,
    education: data.education,
    ethnicity: data.ethnicity,
    political_interests: data.politicalInterests.join("; "),
    market_interests: data.marketInterests.join("; "),
    civic_interests: data.civicInterests.join("; "),
    email: panelistEmail,
    phone_whatsapp: cleanText(composePhoneNumber(data.phoneCountryCode, data.phoneLocalNumber)),
    facebook: normalizeContactHandle(data.facebook),
    instagram: normalizeContactHandle(data.instagram),
    tiktok: normalizeContactHandle(data.tiktok),
    other_contact: normalizeContactHandle(data.otherContact),
    other_contact_platform: normalizeContactPlatform(otherPlatform),
    street_address: cleanText(data.streetAddress),
    photo_id_type: data.photoIdType,
    photo_id_last4: "",
    username: cleanText(username),
    password_salt: salt,
    password_hash: hash,
    verification_status: verificationStatus,
    consent_research: String(data.consentResearch),
    consent_contact: String(data.consentContact),
    consent_privacy: String(data.consentPrivacy),
    status: "Active",
    notes: data.registrationMode === "Registration by authorised person"
      ? `Authorised registration; code: ${cleanText(data.authorisedVerificationCode)}`
      : "",
  };

  rows.push(newRow);
  await savePanelists(rows);
  return { verificationStatus };
}

export async function updatePanelistProfile(
  email: string,
  data: ProfileUpdateFormData,
  accountEmail: string
): Promise<PanelistRow> {
  const normalized = cleanText(email).toLowerCase();
  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === normalized);
  if (index === -1) {
    throw new Error("not_found");
  }

  const existing = rows[index];
  const registeredVoter = isRegisteredVoter(data.citizenshipStatus, data.votingStatus);
  const voterStatus = registeredVoter ? "Registered voter" : "Not applicable";
  const votingStatus =
    data.citizenshipStatus === "Citizen of Belize" ||
    data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize"
      ? data.votingStatus
      : data.citizenshipStatus === "Other resident of Belize"
        ? "No"
        : "Not registered to vote in Belize";

  const cityFinal =
    data.placeOfResidence === "Abroad"
      ? cleanText(data.cityTownVillage)
      : data.cityTownVillage === "Other"
        ? data.cityTownVillageOther
        : data.cityTownVillage;
  const otherPlatform =
    data.otherContactPlatform === "Other" ? data.otherContactPlatformCustom : data.otherContactPlatform;

  const updated: PanelistRow = {
    ...existing,
    education: cleanText(data.education),
    citizenship_status: data.citizenshipStatus,
    commonwealth_country:
      data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize"
        ? cleanText(data.commonwealthCountry)
        : "",
    voting_status: votingStatus,
    voter_status: voterStatus,
    constituency: registeredVoter ? data.constituency : "",
    registered_ctv_area: registeredVoter ? cleanText(data.registeredCtvArea) : "",
    place_of_residence: data.placeOfResidence,
    district: data.placeOfResidence === "Abroad" ? "" : data.placeOfResidence,
    city_town_village: cleanText(cityFinal),
    country_if_abroad: data.placeOfResidence === "Abroad" ? cleanText(data.countryIfAbroad) : "",
    phone_whatsapp: existing.phone_whatsapp,
    facebook: normalizeContactHandle(data.facebook),
    instagram: normalizeContactHandle(data.instagram),
    tiktok: normalizeContactHandle(data.tiktok),
    other_contact: normalizeContactHandle(data.otherContact),
    other_contact_platform: normalizeContactPlatform(otherPlatform),
    street_address: cleanText(data.streetAddress),
    political_interests: data.politicalInterests.join("; "),
    market_interests: data.marketInterests.join("; "),
    civic_interests: data.civicInterests.join("; "),
    email: cleanText(accountEmail),
  };

  rows[index] = updated;
  await savePanelists(rows);
  return updated;
}
