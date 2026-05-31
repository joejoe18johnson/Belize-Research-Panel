import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { AccountRecord } from "./auth-types";
import { findAccountById, verifyAccountPassword } from "./accounts";
import { findPanelistByEmail, loadPanelists, savePanelists, type PanelistRow } from "./panelists";
import { cleanText } from "./validation";

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const NOTIFICATION_STATE_FILE = path.join(DATA_DIR, "panelist-notification-state.json");
const POINTS_OVERRIDE_FILE = path.join(DATA_DIR, "panelist-points-overrides.json");
const REDEMPTION_REQUESTS_FILE = path.join(DATA_DIR, "redemption-requests.json");
const PANELIST_SURVEYS_FILE = path.join(DATA_DIR, "panelist-surveys.json");

function normalizeEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

async function removeAccountRecord(accountId: string): Promise<void> {
  let accounts: AccountRecord[] = [];
  try {
    const content = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    accounts = JSON.parse(content) as AccountRecord[];
    if (!Array.isArray(accounts)) accounts = [];
  } catch {
    return;
  }

  const next = accounts.filter((account) => account.id !== accountId);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(next, null, 2), "utf-8");
}

function anonymizedPanelistRow(row: PanelistRow): PanelistRow {
  const token = randomUUID().slice(0, 8);

  return {
    ...row,
    first_name: "Removed",
    last_name: "User",
    email: `removed-${token}@optout.local`,
    phone_whatsapp: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    other_contact: "",
    other_contact_platform: "",
    street_address: "",
    photo_id_last4: "",
    username: `removed-${token}`,
    password_salt: "",
    password_hash: "",
    political_interests: "",
    market_interests: "",
    civic_interests: "",
    status: "Withdrawn",
    verification_status: "Rejected",
    consent_research: "false",
    consent_contact: "false",
    consent_privacy: "false",
    notes: `Account deleted and opted out on ${new Date().toISOString()}`,
  };
}

async function withdrawPanelistRecord(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const rows = await loadPanelists();
  const index = rows.findIndex((row) => normalizeEmail(row.email) === normalized);
  if (index < 0) return;

  rows[index] = anonymizedPanelistRow(rows[index]);
  await savePanelists(rows);
}

async function deletePanelistUploads(username: string): Promise<void> {
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
      .filter(
        (file) =>
          file.startsWith(`photo-id-${safeUsername}`) ||
          file.startsWith(`residence-proof-${safeUsername}`)
      )
      .map((file) => fs.unlink(path.join(UPLOADS_DIR, file)).catch(() => undefined))
  );
}

async function removeJsonStoreKey(filePath: string, email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  let store: Record<string, unknown> = {};
  try {
    const content = await fs.readFile(filePath, "utf-8");
    store = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return;
  }

  if (!(key in store)) return;
  delete store[key];
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf-8");
}

async function removePanelistSurveyAssignments(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  let records: { panelistEmail?: string }[] = [];
  try {
    const content = await fs.readFile(PANELIST_SURVEYS_FILE, "utf-8");
    records = JSON.parse(content) as { panelistEmail?: string }[];
    if (!Array.isArray(records)) return;
  } catch {
    return;
  }

  const next = records.filter((record) => normalizeEmail(record.panelistEmail ?? "") !== key);
  await fs.writeFile(PANELIST_SURVEYS_FILE, JSON.stringify(next, null, 2), "utf-8");
}

export async function deleteAccountAndOptOut(
  accountId: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const account = await findAccountById(accountId);
  if (!account) {
    return { ok: false, error: "Account not found." };
  }

  const verified = await verifyAccountPassword(account.email, password);
  if (!verified || verified.id !== accountId) {
    return { ok: false, error: "Incorrect password." };
  }

  const panelist = await findPanelistByEmail(account.email);
  const username = panelist ? cleanText(panelist.username) : "";

  if (panelist) {
    await deletePanelistUploads(username);
    await withdrawPanelistRecord(account.email);
  }

  await Promise.all([
    removeJsonStoreKey(NOTIFICATION_STATE_FILE, account.email),
    removeJsonStoreKey(POINTS_OVERRIDE_FILE, account.email),
    removeJsonStoreKey(REDEMPTION_REQUESTS_FILE, account.email),
    removePanelistSurveyAssignments(account.email),
  ]);

  await removeAccountRecord(accountId);

  return { ok: true };
}
