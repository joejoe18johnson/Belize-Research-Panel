import { createHash, randomUUID } from "crypto";
import { normalizeDobForComparison } from "./dob";
import { promises as fs } from "fs";
import path from "path";
import { PANELIST_COLUMNS, PHOTO_ID_TYPES, isCommonwealthCitizenInBelize, ownsBusinessOrNgo, storedVotingStatus } from "./constants";
import { flattenFirstOrganisation } from "./organisations";
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
import { composeStreetAddress } from "./street-address";
import type { RegistrationFormData } from "./registration-types";
import type { ProfileUpdateFormData } from "./profile-update-types";
import { authorisedRegistrationNotes } from "./authorised-registrars";
import { logServerError } from "./safe-log";

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
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseListPanelists } = await import("./supabase/repos");
    return supabaseListPanelists();
  }
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

export async function findPanelistByEmail(email: string, accountId?: string): Promise<PanelistRow | null> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return null;
  const rows = await loadPanelists();
  const matches = rows.filter((row) => cleanText(row.email).toLowerCase() === normalized);
  if (accountId) {
    return matches.find((row) => cleanText(row.account_id) === accountId) ?? matches[0] ?? null;
  }
  return matches[0] ?? null;
}

export async function updatePanelistEmail(oldEmail: string, newEmail: string): Promise<boolean> {
  const oldNorm = cleanText(oldEmail).toLowerCase();
  const newNorm = cleanText(newEmail).toLowerCase();
  if (!oldNorm || !newNorm || oldNorm === newNorm) return false;

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseRetargetPanelistEmail } = await import("./supabase/repos");
    return supabaseRetargetPanelistEmail(oldNorm, newNorm);
  }

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === oldNorm);
  if (index < 0) return false;
  if (rows.some((row, i) => i !== index && cleanText(row.email).toLowerCase() === newNorm)) {
    throw new Error("The new email is already used by another panelist.");
  }

  rows[index] = { ...rows[index], email: newNorm };
  await savePanelists(rows);

  const { reassignSurveyAssignmentEmail } = await import("./panelist-surveys-store");
  await reassignSurveyAssignmentEmail(oldNorm, newNorm);
  const { reassignSurveyResponseEmail } = await import("./survey-responses");
  await reassignSurveyResponseEmail(oldNorm, newNorm);
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
    photo_id_denial_reason?: string;
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

const PHOTO_ID_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".pdf"]);
const PHOTO_ID_MAX_BYTES = 8 * 1024 * 1024;

async function removeLocalPhotoIdFiles(username: string): Promise<void> {
  const safeUsername = cleanText(username);
  if (!safeUsername) return;
  let files: string[] = [];
  try {
    files = await fs.readdir(UPLOADS_DIR);
  } catch {
    return;
  }
  await Promise.all(
    files
      .filter((file) => file.startsWith(`photo-id-${safeUsername}`))
      .map((file) => fs.unlink(path.join(UPLOADS_DIR, file)).catch(() => undefined))
  );
}

export async function replaceDeniedPhotoId(
  accountEmail: string,
  input: { photoIdType: string; file: File }
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalized = cleanText(accountEmail).toLowerCase();
  const photoIdType = cleanText(input.photoIdType);
  if (!normalized) return { ok: false, message: "Panelist profile not found." };
  if (!PHOTO_ID_TYPES.includes(photoIdType)) {
    return { ok: false, message: "Choose a photo ID type." };
  }
  const file = input.file;
  const ext = path.extname(file?.name || "").toLowerCase();
  if (!file || file.size <= 0 || !PHOTO_ID_EXTENSIONS.has(ext)) {
    return { ok: false, message: "Upload a PNG, JPG, or PDF." };
  }
  if (file.size > PHOTO_ID_MAX_BYTES) {
    return { ok: false, message: "That file is too large. Use a PNG, JPG, or PDF under 8 MB." };
  }

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === normalized);
  if (index < 0) return { ok: false, message: "Panelist profile not found." };

  const current = rows[index];
  if (!cleanText(current.username)) {
    return { ok: false, message: "This profile is missing a username, so a new document cannot be saved." };
  }
  if (cleanText(current.admin_photo_id_approved).toLowerCase() !== "false") {
    return {
      ok: false,
      message: "You can submit another document after photo identification is not approved.",
    };
  }

  const { useSupabase } = await import("./supabase/data-source");
  let photoIdPath = "";
  if (useSupabase()) {
    const { supabaseDeletePhotoIdDocument, supabaseUploadPanelistFile } = await import("./supabase/repos");
    await supabaseDeletePhotoIdDocument(current).catch(() => undefined);
    const folderId = cleanText(current.account_id) || cleanText(current.username) || normalized;
    photoIdPath = await supabaseUploadPanelistFile(folderId, "photo_id", file);
  }

  await removeLocalPhotoIdFiles(current.username);
  if (!useSupabase()) {
    await saveUploadedFile(file, `photo-id-${cleanText(current.username)}`);
  }

  const next: PanelistRow = {
    ...current,
    photo_id_type: photoIdType,
    photo_id_path: photoIdPath,
    admin_photo_id_approved: "",
    photo_id_denial_reason: "",
  };
  const { verificationStatusFromRequirementApprovals } = await import("./panelist-requirements");
  next.verification_status = verificationStatusFromRequirementApprovals(next, { hasPhotoUpload: true });
  rows[index] = next;
  await savePanelists(rows);
  return { ok: true };
}

export async function clearPanelistPhotoIdPath(accountEmail: string): Promise<void> {
  const normalized = cleanText(accountEmail).toLowerCase();
  if (!normalized) return;

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseClearPanelistPhotoIdPath } = await import("./supabase/repos");
    await supabaseClearPanelistPhotoIdPath(normalized);
    return;
  }

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === normalized);
  if (index < 0) return;
  rows[index] = { ...rows[index], photo_id_path: "" };
  await savePanelists(rows);
}

export async function savePanelists(rows: PanelistRow[]): Promise<void> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseSyncPanelists } = await import("./supabase/repos");
    await supabaseSyncPanelists(rows);
    return;
  }
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
  photoIdLast4 = "",
  options: {
    ignoreEmails?: string[];
    ignoreEmailDuplicates?: boolean;
    ignorePhoneDuplicates?: boolean;
    ignoreIdentityDuplicates?: boolean;
  } = {}
): { hardDuplicate: boolean; possibleDuplicate: boolean } {
  let hardDuplicate = false;
  const possibleDuplicate = false;
  const ignoreEmails = new Set(
    (options.ignoreEmails ?? []).map((email) => cleanText(email).toLowerCase()).filter(Boolean)
  );

  const emailNorm = cleanText(data.email).toLowerCase();
  const phoneNorm = normalizePhoneForComparison(getFullPhoneNumber(data));
  const firstNorm = cleanText(data.firstName).toLowerCase().replace(/\s+/g, " ").trim();
  const lastNorm = cleanText(data.lastName).toLowerCase().replace(/\s+/g, " ").trim();
  const dobNorm = normalizeDobForComparison(cleanText(data.dob));
  const idTypeNorm = cleanText(data.photoIdType).toLowerCase();
  const idLast4Norm = cleanText(photoIdLast4);

  for (const row of rows) {
    if (ignoreEmails.has(cleanText(row.email).toLowerCase())) continue;
    if (!options.ignoreEmailDuplicates && emailNorm && cleanText(row.email).toLowerCase() === emailNorm) {
      hardDuplicate = true;
    }
    if (!options.ignorePhoneDuplicates && phoneNorm && normalizePhoneForComparison(row.phone_whatsapp) === phoneNorm) {
      hardDuplicate = true;
    }
    if (
      !options.ignoreIdentityDuplicates &&
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
      !options.ignoreIdentityDuplicates &&
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
    accountId?: string;
  },
  authorisedBy?: { code: string; name: string }
): Promise<{ verificationStatus: string }> {
  const rows = await loadPanelists();
  const registeredVoter = isRegisteredVoter(data.citizenshipStatus, data.votingStatus);
  const voterStatus = registeredVoter ? "Registered voter" : "Not applicable";
  const votingStatus = storedVotingStatus(data.citizenshipStatus, data.votingStatus);

  const cityFinal =
    data.placeOfResidence === "Abroad"
      ? cleanText(data.usDiasporaRegion)
      : data.cityTownVillage === "Other"
        ? data.cityTownVillageOther
        : data.cityTownVillage;
  const otherPlatform =
    data.otherContactPlatform === "Other"
      ? data.otherContactPlatformCustom
      : data.otherContactPlatform;

  const { loadPlatformTestingSettings } = await import("./platform-testing-settings-store");
  const testing = await loadPlatformTestingSettings();
  const { hardDuplicate, possibleDuplicate } = duplicateCheck(rows, data, "", {
    ignoreEmails: credentials?.accountEmail ? [credentials.accountEmail] : [],
    ignoreEmailDuplicates: testing.allowDuplicateEmails,
    ignorePhoneDuplicates: testing.allowDuplicatePhones,
    ignoreIdentityDuplicates: testing.allowDuplicateEmails || testing.allowDuplicatePhones,
  });
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

  const { useSupabase } = await import("./supabase/data-source");
  let photoIdPath = "";
  let residenceProofPath = "";

  if (useSupabase()) {
    const { supabaseUploadPanelistFile } = await import("./supabase/repos");
    const folderId = credentials?.accountId ?? cleanText(username);
    try {
      if (data.photoIdFile) {
        photoIdPath = await supabaseUploadPanelistFile(folderId, "photo_id", data.photoIdFile);
      }
      if (data.proofOfBelizeResidenceFile) {
        residenceProofPath = await supabaseUploadPanelistFile(
          folderId,
          "residence_proof",
          data.proofOfBelizeResidenceFile
        );
      }
    } catch (error) {
      logServerError("Panelist document upload failed", error);
      throw new Error("document_upload_failed");
    }
  } else {
    if (data.photoIdFile) {
      await saveUploadedFile(data.photoIdFile, `photo-id-${cleanText(username)}`);
    }
    if (data.proofOfBelizeResidenceFile) {
      await saveUploadedFile(data.proofOfBelizeResidenceFile, `residence-proof-${cleanText(username)}`);
    }
  }

  const newRow: PanelistRow = {
    registration_date: registrationDate,
    first_name: titleCaseName(data.firstName),
    last_name: titleCaseName(data.lastName),
    dob: data.dob,
    age: String(calculateAge(data.dob)),
    citizenship_status: data.citizenshipStatus,
    commonwealth_country:
      isCommonwealthCitizenInBelize(data.citizenshipStatus)
        ? cleanText(data.commonwealthCountry)
        : "",
    voting_status: votingStatus,
    voter_status: voterStatus,
    place_of_residence: data.placeOfResidence,
    district: data.placeOfResidence === "Abroad" ? "" : data.placeOfResidence,
    city_town_village: cleanText(cityFinal),
    country_if_abroad: data.placeOfResidence === "Abroad" ? data.countryIfAbroad : "",
    country_if_abroad_other:
      data.placeOfResidence === "Abroad" && data.countryIfAbroad === "Other"
        ? cleanText(data.countryIfAbroadOther)
        : "",
    residence_region: data.placeOfResidence === "Abroad" ? cleanText(data.usDiasporaRegion) : "",
    constituency: registeredVoter ? data.constituency : "",
    registered_ctv_area: registeredVoter
      ? cleanText(
          data.registeredCtvArea === "Other" ? data.registeredCtvAreaOther : data.registeredCtvArea
        )
      : "",
    sex: data.sex,
    education: data.education,
    ethnicity: data.ethnicity,
    household_head_relationship: data.householdHeadRelationship,
    household_size: cleanText(data.householdSize),
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
    street_address: composeStreetAddress({
      addressHouseNumber: data.addressHouseNumber,
      streetAddress: data.streetAddress,
      addressCityVillage: data.addressCityVillage,
      addressCityVillageOther: data.addressCityVillageOther,
      addressDistrict: data.addressDistrict,
    }),
    photo_id_type: data.photoIdType,
    photo_id_last4: "",
    photo_id_path: photoIdPath,
    residence_proof_path: residenceProofPath,
    account_id: credentials?.accountId ?? "",
    authorised_verification_code: authorisedBy?.code ?? "",
    authorised_registrar_name: authorisedBy?.name ?? "",
    username: cleanText(username),
    password_salt: salt,
    password_hash: hash,
    verification_status: verificationStatus,
    admin_email_approved: "true",
    consent_research: String(data.consentResearch),
    consent_contact: String(data.consentContact),
    consent_privacy: String(data.consentPrivacy),
    owns_business_or_ngo: cleanText(data.ownsBusinessOrNgo),
    organisations: ownsBusinessOrNgo(data.ownsBusinessOrNgo)
      ? JSON.stringify(
          (Array.isArray(data.organisations) ? data.organisations : []).map((org) => ({
            name: cleanText(org.name),
            houseNumber: cleanText(org.houseNumber),
            streetAddress: cleanText(org.streetAddress),
            cityVillage: cleanText(org.cityVillage),
            cityVillageOther: cleanText(org.cityVillageOther),
            district: cleanText(org.district),
            description: cleanText(org.description),
            size: cleanText(org.size),
            ownershipStructure: cleanText(org.ownershipStructure),
            ownershipStructureOther:
              org.ownershipStructure === "Other" ? cleanText(org.ownershipStructureOther) : "",
            yearStarted: cleanText(org.yearStarted),
            contactMeans: cleanText(org.contactMeans),
          }))
        )
      : "[]",
    ...(() => {
      const first = ownsBusinessOrNgo(data.ownsBusinessOrNgo)
        ? flattenFirstOrganisation(data.organisations ?? [])
        : null;
      return {
        org_name: first ? cleanText(first.orgName) : "",
        org_street_address: first ? cleanText(first.orgStreetAddress) : "",
        org_city_village: first ? cleanText(first.orgCityVillage) : "",
        org_district: first ? cleanText(first.orgDistrict) : "",
        org_description: first ? cleanText(first.orgDescription) : "",
        org_size: first ? cleanText(first.orgSize) : "",
        org_ownership_structure: first ? cleanText(first.orgOwnershipStructure) : "",
        org_ownership_structure_other:
          first && first.orgOwnershipStructure === "Other"
            ? cleanText(first.orgOwnershipStructureOther)
            : "",
        org_year_started: first ? cleanText(first.orgYearStarted) : "",
        org_contact_means: first ? cleanText(first.orgContactMeans) : "",
      };
    })(),
    status: "Active",
    notes: authorisedBy
      ? authorisedRegistrationNotes(authorisedBy.code, authorisedBy.name)
      : "",
  };

  const existingIndex = rows.findIndex((row) => {
    if (credentials?.accountId && cleanText(row.account_id)) {
      return cleanText(row.account_id) === credentials.accountId;
    }
    return cleanText(row.email).toLowerCase() === cleanText(panelistEmail).toLowerCase();
  });
  if (existingIndex >= 0) {
    rows[existingIndex] = { ...rows[existingIndex], ...newRow };
  } else {
    rows.push(newRow);
  }

  if (useSupabase()) {
    const { supabaseInsertPanelist } = await import("./supabase/repos");
    await supabaseInsertPanelist(newRow, credentials?.accountId, {
      photoIdPath: photoIdPath || undefined,
      residenceProofPath: residenceProofPath || undefined,
    });
    return { verificationStatus };
  }

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
  const votingStatus = storedVotingStatus(data.citizenshipStatus, data.votingStatus);

  const cityFinal =
    data.placeOfResidence === "Abroad"
      ? cleanText(data.usDiasporaRegion)
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
      isCommonwealthCitizenInBelize(data.citizenshipStatus)
        ? cleanText(data.commonwealthCountry)
        : "",
    voting_status: votingStatus,
    voter_status: voterStatus,
    constituency: registeredVoter ? data.constituency : "",
    registered_ctv_area: registeredVoter
      ? cleanText(
          data.registeredCtvArea === "Other" ? data.registeredCtvAreaOther : data.registeredCtvArea
        )
      : "",
    place_of_residence: data.placeOfResidence,
    district: data.placeOfResidence === "Abroad" ? "" : data.placeOfResidence,
    city_town_village: cleanText(cityFinal),
    country_if_abroad: data.placeOfResidence === "Abroad" ? cleanText(data.countryIfAbroad) : "",
    country_if_abroad_other:
      data.placeOfResidence === "Abroad" && data.countryIfAbroad === "Other"
        ? cleanText(data.countryIfAbroadOther)
        : "",
    residence_region: data.placeOfResidence === "Abroad" ? cleanText(data.usDiasporaRegion) : "",
    phone_whatsapp: existing.phone_whatsapp,
    facebook: normalizeContactHandle(data.facebook),
    instagram: normalizeContactHandle(data.instagram),
    tiktok: normalizeContactHandle(data.tiktok),
    other_contact: normalizeContactHandle(data.otherContact),
    other_contact_platform: normalizeContactPlatform(otherPlatform),
    street_address: composeStreetAddress({
      addressHouseNumber: data.addressHouseNumber,
      streetAddress: data.streetAddress,
      addressCityVillage: data.addressCityVillage,
      addressCityVillageOther: data.addressCityVillageOther,
      addressDistrict: data.addressDistrict,
    }),
    political_interests: data.politicalInterests.join("; "),
    market_interests: data.marketInterests.join("; "),
    civic_interests: data.civicInterests.join("; "),
    email: cleanText(accountEmail),
  };

  rows[index] = updated;
  await savePanelists(rows);
  return updated;
}
