import { promises as fs } from "fs";
import path from "path";
import { cleanText } from "./validation";
import { logServerError } from "./safe-log";

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const NOTIFICATION_STATE_FILE = path.join(DATA_DIR, "panelist-notification-state.json");
const POINTS_OVERRIDE_FILE = path.join(DATA_DIR, "panelist-points-overrides.json");
const REWARD_BALANCES_FILE = path.join(DATA_DIR, "panelist-reward-balances.json");
const REDEMPTION_REQUESTS_FILE = path.join(DATA_DIR, "redemption-requests.json");
const PANELIST_SURVEYS_FILE = path.join(DATA_DIR, "panelist-surveys.json");
const SURVEY_RESPONSES_FILE = path.join(DATA_DIR, "survey-responses.json");
const SUPPORT_MESSAGES_FILE = path.join(DATA_DIR, "support-messages.json");
const OUTBOUND_MESSAGES_FILE = path.join(DATA_DIR, "outbound-messages.json");
const PANELIST_GROUPS_FILE = path.join(DATA_DIR, "panelist-groups.json");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "campaigns.json");
const AUTHORISED_REGISTRARS_FILE = path.join(DATA_DIR, "authorised-registrars.json");

function normalizeEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}

async function removeJsonStoreKey(filePath: string, email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const store = await readJsonFile<Record<string, unknown>>(filePath, {});
  if (!(key in store)) return;
  delete store[key];
  await writeJsonFile(filePath, store);
}

async function removePanelistSurveyAssignments(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const records = await readJsonFile<{ panelistEmail?: string }[]>(PANELIST_SURVEYS_FILE, []);
  if (!Array.isArray(records)) return;

  const next = records.filter((record) => normalizeEmail(record.panelistEmail ?? "") !== key);
  if (next.length === records.length) return;
  await writeJsonFile(PANELIST_SURVEYS_FILE, next);
}

async function removeSurveyResponses(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const records = await readJsonFile<{ panelistEmail?: string }[]>(SURVEY_RESPONSES_FILE, []);
  if (!Array.isArray(records)) return;

  const next = records.filter((record) => normalizeEmail(record.panelistEmail ?? "") !== key);
  if (next.length === records.length) return;
  await writeJsonFile(SURVEY_RESPONSES_FILE, next);
}

async function removeSupportMessages(email: string, accountId?: string): Promise<void> {
  const key = normalizeEmail(email);
  const accountKey = cleanText(accountId);
  if (!key && !accountKey) return;

  const records = await readJsonFile<
    { email?: string; panelistEmail?: string; accountId?: string; account_id?: string }[]
  >(SUPPORT_MESSAGES_FILE, []);
  if (!Array.isArray(records) || records.length === 0) return;

  const next = records.filter((record) => {
    const recordEmail = normalizeEmail(record.email ?? record.panelistEmail ?? "");
    const recordAccount = cleanText(record.accountId ?? record.account_id ?? "");
    if (key && recordEmail === key) return false;
    if (accountKey && recordAccount === accountKey) return false;
    return true;
  });
  if (next.length === records.length) return;
  await writeJsonFile(SUPPORT_MESSAGES_FILE, next);
}

/** Removes outbound message logs for an email, including any account-deleted confirmation. */
export async function removeOutboundMessagesForEmail(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const records = await readJsonFile<{ email?: string }[]>(OUTBOUND_MESSAGES_FILE, []);
  if (!Array.isArray(records) || records.length === 0) return;

  const next = records.filter((record) => normalizeEmail(record.email ?? "") !== key);
  if (next.length === records.length) return;
  await writeJsonFile(OUTBOUND_MESSAGES_FILE, next);
}

async function scrubEmailFromPanelistGroups(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const groups = await readJsonFile<{ emails?: string[] }[]>(PANELIST_GROUPS_FILE, []);
  if (!Array.isArray(groups) || groups.length === 0) return;

  let changed = false;
  const next = groups.map((group) => {
    if (!Array.isArray(group.emails) || group.emails.length === 0) return group;
    const emails = group.emails.filter((entry) => normalizeEmail(entry) !== key);
    if (emails.length === group.emails.length) return group;
    changed = true;
    return { ...group, emails };
  });
  if (!changed) return;
  await writeJsonFile(PANELIST_GROUPS_FILE, next);
}

async function scrubEmailFromCampaigns(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const campaigns = await readJsonFile<{ targeting?: { emails?: string[] } }[]>(CAMPAIGNS_FILE, []);
  if (!Array.isArray(campaigns) || campaigns.length === 0) return;

  let changed = false;
  const next = campaigns.map((campaign) => {
    const emails = campaign.targeting?.emails;
    if (!Array.isArray(emails) || emails.length === 0) return campaign;
    const filtered = emails.filter((entry) => normalizeEmail(entry) !== key);
    if (filtered.length === emails.length) return campaign;
    changed = true;
    return {
      ...campaign,
      targeting: {
        ...campaign.targeting,
        emails: filtered,
      },
    };
  });
  if (!changed) return;
  await writeJsonFile(CAMPAIGNS_FILE, next);
}

async function scrubRegistrarUsedByEmail(email: string): Promise<void> {
  const key = normalizeEmail(email);
  if (!key) return;

  const store = await readJsonFile<{ registrars?: { usedByEmail?: string }[] } | { usedByEmail?: string }[]>(
    AUTHORISED_REGISTRARS_FILE,
    { registrars: [] }
  );

  if (Array.isArray(store)) {
    let changed = false;
    const next = store.map((registrar) => {
      if (normalizeEmail(registrar.usedByEmail ?? "") !== key) return registrar;
      changed = true;
      return { ...registrar, usedByEmail: "" };
    });
    if (changed) await writeJsonFile(AUTHORISED_REGISTRARS_FILE, next);
    return;
  }

  if (!Array.isArray(store.registrars)) return;
  let changed = false;
  const registrars = store.registrars.map((registrar) => {
    if (normalizeEmail(registrar.usedByEmail ?? "") !== key) return registrar;
    changed = true;
    return { ...registrar, usedByEmail: "" };
  });
  if (!changed) return;
  await writeJsonFile(AUTHORISED_REGISTRARS_FILE, { ...store, registrars });
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

  const accounts = await readJsonFile<{ email?: string }[]>(ACCOUNTS_FILE, []);
  if (!Array.isArray(accounts)) return;

  const next = accounts.filter((account) => normalizeEmail(account.email ?? "") !== key);
  if (next.length === accounts.length) return;
  await writeJsonFile(ACCOUNTS_FILE, next);
}

async function removeAccountById(accountId: string): Promise<void> {
  const id = cleanText(accountId);
  if (!id) return;

  const accounts = await readJsonFile<{ id?: string }[]>(ACCOUNTS_FILE, []);
  if (!Array.isArray(accounts)) return;

  const next = accounts.filter((account) => cleanText(account.id ?? "") !== id);
  if (next.length === accounts.length) return;
  await writeJsonFile(ACCOUNTS_FILE, next);
}

/**
 * Wipes every local data file that still holds personal panelist information.
 * Leaves email_unsubscribes alone so the closed address stays opted out of future mail.
 */
export async function deletePanelistRelatedData(
  email: string,
  username: string,
  options: { accountId?: string; removeAccount?: boolean | "by-email" | "by-id" } = {}
): Promise<void> {
  const removeMode = options.removeAccount === false ? "none" : options.removeAccount === "by-id" ? "by-id" : "by-email";

  try {
    await Promise.all([
      deletePanelistUploads(username),
      removePanelistSurveyAssignments(email),
      removeSurveyResponses(email),
      removeSupportMessages(email, options.accountId),
      removeOutboundMessagesForEmail(email),
      removeJsonStoreKey(NOTIFICATION_STATE_FILE, email),
      removeJsonStoreKey(POINTS_OVERRIDE_FILE, email),
      removeJsonStoreKey(REWARD_BALANCES_FILE, email),
      removeJsonStoreKey(REDEMPTION_REQUESTS_FILE, email),
      scrubEmailFromPanelistGroups(email),
      scrubEmailFromCampaigns(email),
      scrubRegistrarUsedByEmail(email),
      removeMode === "by-id" && options.accountId
        ? removeAccountById(options.accountId)
        : removeMode === "by-email"
          ? removeAccountByEmail(email)
          : Promise.resolve(),
    ]);
  } catch (error) {
    logServerError("Panelist related-data cleanup failed", error);
  }
}
