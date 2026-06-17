import { promises as fs } from "fs";
import path from "path";
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
          file.startsWith(`photo-id-${safeUsername}`) || file.startsWith(`residence-proof-${safeUsername}`)
      )
      .map((file) => fs.unlink(path.join(UPLOADS_DIR, file)).catch(() => undefined))
  );
}

async function removeAccountByEmail(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  let accounts: { email?: string }[] = [];
  try {
    const content = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    accounts = JSON.parse(content) as { email?: string }[];
    if (!Array.isArray(accounts)) return;
  } catch {
    return;
  }

  const next = accounts.filter((account) => normalizeEmail(account.email ?? "") !== key);
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(next, null, 2), "utf-8");
}

export async function deletePanelistRelatedData(email: string, username: string): Promise<void> {
  await Promise.all([
    deletePanelistUploads(username),
    removePanelistSurveyAssignments(email),
    removeJsonStoreKey(NOTIFICATION_STATE_FILE, email),
    removeJsonStoreKey(POINTS_OVERRIDE_FILE, email),
    removeJsonStoreKey(REDEMPTION_REQUESTS_FILE, email),
    removeAccountByEmail(email),
  ]);
}
