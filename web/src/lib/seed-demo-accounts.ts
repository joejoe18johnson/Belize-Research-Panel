import { promises as fs } from "fs";
import path from "path";
import type { AccountRecord } from "./auth-types";
import { DEMO_ACCOUNTS } from "./demo-accounts";

const DATA_DIR = path.join(process.cwd(), "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");

function toAccountRecord(demo: (typeof DEMO_ACCOUNTS)[number]): AccountRecord {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: demo.id,
    first_name: demo.firstName,
    last_name: demo.lastName,
    email: demo.email,
    password_salt: demo.passwordSalt,
    password_hash: demo.passwordHash,
    email_verified: demo.emailVerified ? "true" : "false",
    verification_token: demo.verificationToken,
    verification_sent_at: now,
    created_at: now,
    panelist_registered: demo.panelistRegistered ? "true" : "false",
    citizenship_status: demo.citizenshipStatus ?? "",
    commonwealth_country: "",
    dob: demo.dob ?? "",
    account_status: "active",
    hold_reason: "",
  };
}

export async function seedDemoAccounts(): Promise<{ created: number; updated: number }> {
  let accounts: AccountRecord[] = [];
  try {
    const content = await fs.readFile(ACCOUNTS_FILE, "utf-8");
    const parsed = JSON.parse(content) as AccountRecord[];
    accounts = Array.isArray(parsed) ? parsed : [];
  } catch {
    accounts = [];
  }

  const demoEmails = new Set(DEMO_ACCOUNTS.map((account) => account.email.toLowerCase()));
  const legacyDemoEmails = new Set([
    ...demoEmails,
    "demo.verified@belizepanel.test",
    "demo.unverified@belizepanel.test",
    "demo.registered@belizepanel.test",
    "johannesjohnsonj@gmail.com",
  ]);
  const preserved = accounts.filter((account) => !legacyDemoEmails.has(account.email.toLowerCase()));

  const existingDemoCount = accounts.filter((account) =>
    demoEmails.has(account.email.toLowerCase())
  ).length;

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    ACCOUNTS_FILE,
    JSON.stringify([...preserved, ...DEMO_ACCOUNTS.map(toAccountRecord)], null, 2),
    "utf-8"
  );

  return {
    created: DEMO_ACCOUNTS.length - existingDemoCount,
    updated: existingDemoCount,
  };
}
