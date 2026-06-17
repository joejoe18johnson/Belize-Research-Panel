import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  AccountContactHoldState,
  AccountHoldReason,
  AccountRecord,
  AccountStatus,
  SessionAccount,
} from "./auth-types";
import { hashPassword, loadPanelists } from "./panelists";
import {
  cleanText,
  composePhoneNumber,
  normalizePhoneForComparison,
  titleCaseName,
  validEmail,
  validatePhoneFields,
} from "./validation";

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

async function loadAccountsRaw(): Promise<AccountRecord[]> {
  try {
    const content = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    const parsed = JSON.parse(content) as AccountRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAccountsRaw(accounts: AccountRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
}

function hasPendingEmailChange(record: AccountRecord): boolean {
  return Boolean(cleanText(record.pending_email));
}

function hasPendingPhoneChange(record: AccountRecord): boolean {
  return Boolean(cleanText(record.pending_phone_whatsapp));
}

function computeContactHoldReason(record: AccountRecord): AccountHoldReason {
  const emailPending = hasPendingEmailChange(record);
  const phonePending = hasPendingPhoneChange(record);
  if (emailPending && phonePending) return "email_and_phone";
  if (emailPending) return "email_change";
  if (phonePending) return "phone_change";
  return "";
}

function computeHoldReason(record: AccountRecord): AccountHoldReason {
  const contactReason = computeContactHoldReason(record);
  if (contactReason) return contactReason;
  if (record.account_status === "on_hold" && record.hold_reason === "fraud_review") {
    return "fraud_review";
  }
  return "";
}

function accountStatus(record: AccountRecord): AccountStatus {
  return computeHoldReason(record) ? "on_hold" : "active";
}

function applyHoldSync(record: AccountRecord): AccountRecord {
  const contactReason = computeContactHoldReason(record);
  if (contactReason) {
    return {
      ...record,
      account_status: "on_hold",
      hold_reason: contactReason,
    };
  }
  if (record.hold_reason === "fraud_review") {
    return {
      ...record,
      account_status: "on_hold",
      hold_reason: "fraud_review",
    };
  }
  return {
    ...record,
    account_status: "active",
    hold_reason: "",
    pending_email: "",
    email_change_token: "",
    email_change_sent_at: "",
    email_change_requested_at: "",
    pending_phone_whatsapp: "",
    phone_change_requested_at: "",
  };
}

export function getAccountContactHoldState(record: AccountRecord): AccountContactHoldState {
  return {
    accountStatus: accountStatus(record),
    holdReason: computeHoldReason(record),
    pendingEmail: cleanText(record.pending_email),
    pendingPhone: cleanText(record.pending_phone_whatsapp),
    phoneChangeRequestedAt: cleanText(record.phone_change_requested_at),
    emailChangeRequestedAt: cleanText(record.email_change_requested_at),
    emailChangeSentAt: cleanText(record.email_change_sent_at),
  };
}

export async function findAccountByEmail(email: string): Promise<AccountRecord | null> {
  const normalized = cleanText(email).toLowerCase();
  const accounts = await loadAccountsRaw();
  return accounts.find((account) => cleanText(account.email).toLowerCase() === normalized) ?? null;
}

export async function findAccountById(id: string): Promise<AccountRecord | null> {
  const accounts = await loadAccountsRaw();
  return accounts.find((account) => account.id === id) ?? null;
}

export async function findAccountByVerificationToken(token: string): Promise<AccountRecord | null> {
  if (!token) return null;
  const accounts = await loadAccountsRaw();
  return accounts.find((account) => account.verification_token === token) ?? null;
}

export async function findAccountByEmailChangeToken(token: string): Promise<AccountRecord | null> {
  if (!token) return null;
  const accounts = await loadAccountsRaw();
  return accounts.find((account) => account.email_change_token === token) ?? null;
}

export async function createAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  citizenshipStatus: string;
  commonwealthCountry: string;
  dob: string;
}): Promise<{ account: AccountRecord; verificationToken: string }> {
  const email = cleanText(input.email).toLowerCase();
  if (!validEmail(email)) {
    throw new Error("invalid_email");
  }
  if (await findAccountByEmail(email)) {
    throw new Error("email_exists");
  }

  const { salt, hash } = hashPassword(input.password);
  const verificationToken = randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();

  const account: AccountRecord = {
    id: randomUUID(),
    first_name: titleCaseName(input.firstName),
    last_name: titleCaseName(input.lastName),
    email,
    password_salt: salt,
    password_hash: hash,
    email_verified: "false",
    verification_token: verificationToken,
    verification_sent_at: now,
    created_at: now,
    panelist_registered: "false",
    citizenship_status: cleanText(input.citizenshipStatus),
    commonwealth_country:
      input.citizenshipStatus === "Citizen of a Commonwealth country living in Belize"
        ? cleanText(input.commonwealthCountry)
        : "",
    dob: cleanText(input.dob),
    account_status: "active",
    hold_reason: "",
  };

  const accounts = await loadAccountsRaw();
  accounts.push(account);
  await saveAccountsRaw(accounts);
  return { account, verificationToken };
}

export async function verifyAccountEmail(token: string): Promise<AccountRecord | null> {
  const account = await findAccountByVerificationToken(token);
  if (!account) return null;

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((row) => row.id === account.id);
  if (index < 0) return null;

  accounts[index] = {
    ...accounts[index],
    email_verified: "true",
    verification_token: "",
  };
  await saveAccountsRaw(accounts);
  return accounts[index];
}

export async function approveAccountEmailChange(
  accountEmail: string
): Promise<{ account: AccountRecord; previousEmail: string } | null> {
  const account = await findAccountByEmail(accountEmail);
  if (!account || !hasPendingEmailChange(account)) return null;

  const newEmail = cleanText(account.pending_email).toLowerCase();
  if (!newEmail || !validEmail(newEmail)) return null;

  const taken = await findAccountByEmail(newEmail);
  if (taken && taken.id !== account.id) return null;

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((row) => row.id === account.id);
  if (index < 0) return null;

  const previousEmail = accounts[index].email;

  let updated: AccountRecord = {
    ...accounts[index],
    email: newEmail,
    pending_email: "",
    email_change_token: "",
    email_change_sent_at: "",
    email_change_requested_at: "",
  };
  updated = applyHoldSync(updated);
  accounts[index] = updated;
  await saveAccountsRaw(accounts);

  return { account: updated, previousEmail };
}

export async function getPendingEmailForApproval(accountEmail: string): Promise<string | null> {
  const account = await findAccountByEmail(accountEmail);
  if (!account || !hasPendingEmailChange(account)) return null;
  return cleanText(account.pending_email).toLowerCase();
}

export async function requestAccountEmailChange(
  accountId: string,
  newEmailRaw: string
): Promise<AccountRecord> {
  const newEmail = cleanText(newEmailRaw).toLowerCase();
  if (!validEmail(newEmail)) {
    throw new Error("invalid_email");
  }

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((row) => row.id === accountId);
  if (index < 0) throw new Error("not_found");

  const current = accounts[index];
  if (cleanText(current.email).toLowerCase() === newEmail) {
    throw new Error("same_email");
  }

  const taken = accounts.find(
    (row) => row.id !== accountId && cleanText(row.email).toLowerCase() === newEmail
  );
  if (taken) throw new Error("email_exists");

  const pendingTaken = accounts.find(
    (row) => row.id !== accountId && cleanText(row.pending_email).toLowerCase() === newEmail
  );
  if (pendingTaken) throw new Error("email_exists");

  let updated: AccountRecord = {
    ...current,
    pending_email: newEmail,
    email_change_token: "",
    email_change_sent_at: "",
    email_change_requested_at: new Date().toISOString(),
  };
  updated = applyHoldSync(updated);
  accounts[index] = updated;
  await saveAccountsRaw(accounts);

  return updated;
}

export async function requestAccountPhoneChange(
  accountId: string,
  phoneCountryCode: string,
  phoneLocalNumber: string
): Promise<AccountRecord> {
  const phoneError = validatePhoneFields({ phoneCountryCode, phoneLocalNumber });
  if (phoneError) throw new Error("invalid_phone");

  const composed = cleanText(composePhoneNumber(phoneCountryCode, phoneLocalNumber));
  if (!composed) throw new Error("invalid_phone");

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((row) => row.id === accountId);
  if (index < 0) throw new Error("not_found");

  const current = accounts[index];
  const panelistRows = await loadPanelists();
  if (isPhoneDuplicateAmongPanelists(composed, panelistRows, current.email)) {
    throw new Error("phone_exists");
  }

  let updated: AccountRecord = {
    ...current,
    pending_phone_whatsapp: composed,
    phone_change_requested_at: new Date().toISOString(),
  };
  updated = applyHoldSync(updated);
  accounts[index] = updated;
  await saveAccountsRaw(accounts);
  return updated;
}

export async function approveAccountPhoneChange(accountEmail: string): Promise<AccountRecord | null> {
  const account = await findAccountByEmail(accountEmail);
  if (!account || !hasPendingPhoneChange(account)) return null;

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((row) => row.id === account.id);
  if (index < 0) return null;

  let updated: AccountRecord = {
    ...accounts[index],
    pending_phone_whatsapp: "",
    phone_change_requested_at: "",
  };
  updated = applyHoldSync(updated);
  accounts[index] = updated;
  await saveAccountsRaw(accounts);
  return updated;
}

export async function getPendingPhoneForApproval(accountEmail: string): Promise<string | null> {
  const account = await findAccountByEmail(accountEmail);
  if (!account || !hasPendingPhoneChange(account)) return null;
  return cleanText(account.pending_phone_whatsapp);
}

export async function putAccountOnHoldForFraudReview(email: string): Promise<boolean> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return false;

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((account) => cleanText(account.email).toLowerCase() === normalized);
  if (index < 0) return false;

  accounts[index] = applyHoldSync({
    ...accounts[index],
    account_status: "on_hold",
    hold_reason: "fraud_review",
  });
  await saveAccountsRaw(accounts);
  return true;
}

export async function releaseAccountFromFraudReview(email: string): Promise<boolean> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return false;

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((account) => cleanText(account.email).toLowerCase() === normalized);
  if (index < 0) return false;
  if (accounts[index].hold_reason !== "fraud_review") return false;

  accounts[index] = applyHoldSync({
    ...accounts[index],
    account_status: "active",
    hold_reason: "",
  });
  await saveAccountsRaw(accounts);
  return true;
}

export async function markAccountPanelistRegistered(accountId: string): Promise<void> {
  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((row) => row.id === accountId);
  if (index < 0) return;
  accounts[index] = { ...accounts[index], panelist_registered: "true" };
  await saveAccountsRaw(accounts);
}

export async function setAccountEmailVerifiedByAdmin(email: string, verified: boolean): Promise<boolean> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return false;

  const accounts = await loadAccountsRaw();
  const index = accounts.findIndex((account) => cleanText(account.email).toLowerCase() === normalized);
  if (index < 0) return false;

  accounts[index] = {
    ...accounts[index],
    email_verified: verified ? "true" : "false",
    ...(verified ? { verification_token: "" } : {}),
  };
  await saveAccountsRaw(accounts);
  return true;
}

export async function verifyAccountPassword(
  email: string,
  password: string
): Promise<AccountRecord | null> {
  const account = await findAccountByEmail(email);
  if (!account) return null;
  const { hash } = hashPassword(password, account.password_salt);
  if (hash !== account.password_hash) return null;
  return account;
}

export function toSessionAccount(account: AccountRecord): SessionAccount {
  const hold = getAccountContactHoldState(account);
  return {
    id: account.id,
    firstName: account.first_name,
    lastName: account.last_name,
    email: account.email,
    emailVerified: account.email_verified === "true",
    panelistRegistered: account.panelist_registered === "true",
    citizenshipStatus: account.citizenship_status ?? "",
    commonwealthCountry: account.commonwealth_country ?? "",
    dob: account.dob ?? "",
    accountStatus: hold.accountStatus,
    holdReason: hold.holdReason,
    pendingEmail: hold.pendingEmail,
    pendingPhone: hold.pendingPhone,
  };
}

export function isPhoneDuplicateAmongPanelists(
  phone: string,
  rows: { phone_whatsapp?: string; email?: string }[],
  accountEmail: string
): boolean {
  const target = normalizePhoneForComparison(phone);
  if (!target) return false;
  const exclude = cleanText(accountEmail).toLowerCase();
  return rows.some((row) => {
    if (cleanText(row.email ?? "").toLowerCase() === exclude) return false;
    const rowPhone = normalizePhoneForComparison(row.phone_whatsapp ?? "");
    return rowPhone === target;
  });
}
