import { promises as fs } from "fs";
import path from "path";
import type { AccountRecord } from "./auth-types";
import type { AdminReadState } from "./admin-read-state";
import { loadPanelists, savePanelists } from "./panelists";
import { cleanText } from "./validation";

const DATA_DIR = path.join(process.cwd(), "data");

export const DEMO_REQUESTED_AT = "2026-06-17T10:00:00.000Z";

export const DEMO_NOTIFICATION_IDS = [
  "email change:panelist.verified@belizepanel.test",
  "phone change:panelist.pending@belizepanel.test",
  "email verification:panelist.signup@belizepanel.test",
] as const;

export const DEMO_PAYOUT_ID = "demo-payout-pending-glen";
export const DEMO_PAYOUT_EMAIL = "glen.avilez@belizepanel.test";
export const DEMO_CAMPAIGN_ID = "campaign-demo-admin-alert";

const DEMO_EMAIL_CHANGE = {
  accountId: "persona-00000000-0000-0000-0000-000000000003",
  email: "panelist.verified@belizepanel.test",
  pendingEmail: "panelist.verified.new@belizepanel.test",
  emailChangeRequestedAt: DEMO_REQUESTED_AT,
} as const;

const DEMO_PHONE_CHANGE = {
  accountId: "persona-00000000-0000-0000-0000-000000000002",
  email: "panelist.pending@belizepanel.test",
  pendingPhone: "+501 622-3344",
  baselinePhone: "501-600-0000",
  phoneChangeRequestedAt: DEMO_REQUESTED_AT,
} as const;

const DEMO_EMAIL_VERIFICATION = {
  accountId: "persona-00000000-0000-0000-0000-000000000001",
  email: "panelist.signup@belizepanel.test",
  verificationToken: "demo-signup-verify-token",
} as const;

const DEMO_PAYOUT = {
  id: DEMO_PAYOUT_ID,
  email: DEMO_PAYOUT_EMAIL,
  optionId: "gift_card",
  optionLabel: "Gift card",
  points: 500,
  amountBz: 20,
  valueLabel: "BZ$20 gift card",
  status: "pending" as const,
  details: {
    retailer: "Brodi's",
    deliveryEmail: DEMO_PAYOUT_EMAIL,
  },
  notes: "Demo payout for admin notification preview.",
  submittedAt: DEMO_REQUESTED_AT,
  updatedAt: DEMO_REQUESTED_AT,
};

/** Testing mode: demo admin alerts reset after each admin refresh. */
export function isAdminDemoNotificationLoopEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_ADMIN_DEMO_NOTIFICATION_LOOP === "true"
  );
}

export function isDemoAdminNotificationId(id: string): boolean {
  return DEMO_NOTIFICATION_IDS.includes(cleanText(id).toLowerCase() as (typeof DEMO_NOTIFICATION_IDS)[number]);
}

export function isDemoAdminPayoutId(id: string): boolean {
  return cleanText(id) === DEMO_PAYOUT_ID;
}

export function isDemoAdminCampaignId(id: string): boolean {
  return cleanText(id) === DEMO_CAMPAIGN_ID;
}

export function withoutDemoReadEntries(state: AdminReadState): AdminReadState {
  const notifications = { ...state.notifications };
  const payouts = { ...state.payouts };
  const campaigns = { ...state.campaigns };

  for (const id of DEMO_NOTIFICATION_IDS) {
    delete notifications[id];
  }
  delete payouts[DEMO_PAYOUT_ID];
  delete campaigns[DEMO_CAMPAIGN_ID];

  return { notifications, payouts, campaigns };
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}

async function restoreDemoAccounts(): Promise<void> {
  const filePath = path.join(DATA_DIR, "accounts.json");
  const accounts = await readJson<AccountRecord[]>(filePath, []);
  if (!Array.isArray(accounts)) return;

  let changed = false;
  const patched = accounts.map((account) => {
    const email = cleanText(account.email).toLowerCase();
    const id = cleanText(account.id);

    if (
      id === DEMO_EMAIL_CHANGE.accountId ||
      email === DEMO_EMAIL_CHANGE.email ||
      email === DEMO_EMAIL_CHANGE.pendingEmail
    ) {
      changed = true;
      return {
        ...account,
        id: DEMO_EMAIL_CHANGE.accountId,
        email: DEMO_EMAIL_CHANGE.email,
        pending_email: DEMO_EMAIL_CHANGE.pendingEmail,
        email_change_requested_at: DEMO_EMAIL_CHANGE.emailChangeRequestedAt,
      };
    }

    if (id === DEMO_PHONE_CHANGE.accountId || email === DEMO_PHONE_CHANGE.email) {
      changed = true;
      return {
        ...account,
        pending_phone_whatsapp: DEMO_PHONE_CHANGE.pendingPhone,
        phone_change_requested_at: DEMO_PHONE_CHANGE.phoneChangeRequestedAt,
      };
    }

    if (id === DEMO_EMAIL_VERIFICATION.accountId || email === DEMO_EMAIL_VERIFICATION.email) {
      changed = true;
      return {
        ...account,
        email_verified: "false",
        verification_token: DEMO_EMAIL_VERIFICATION.verificationToken,
      };
    }

    return account;
  });

  if (changed) {
    await writeJson(filePath, patched);
  }
}

async function restoreDemoPanelists(): Promise<void> {
  const rows = await loadPanelists();
  let changed = false;

  const patched = rows.map((row) => {
    const email = cleanText(row.email).toLowerCase();

    if (email === DEMO_EMAIL_CHANGE.email || email === DEMO_EMAIL_CHANGE.pendingEmail) {
      changed = true;
      return { ...row, email: DEMO_EMAIL_CHANGE.email };
    }

    if (email === DEMO_PHONE_CHANGE.email) {
      changed = true;
      return { ...row, phone_whatsapp: DEMO_PHONE_CHANGE.baselinePhone };
    }

    return row;
  });

  if (changed) {
    await savePanelists(patched);
  }
}

async function restoreDemoPayout(): Promise<void> {
  const filePath = path.join(DATA_DIR, "redemption-requests.json");
  const store = await readJson<Record<string, typeof DEMO_PAYOUT[]>>(filePath, {});
  const email = DEMO_PAYOUT.email;
  const existing = Array.isArray(store[email]) ? store[email] : [];
  const demoIndex = existing.findIndex((request) => request.id === DEMO_PAYOUT_ID);

  if (demoIndex >= 0) {
    const current = existing[demoIndex];
    if (current.status === "pending") return;
    const next = [...existing];
    next[demoIndex] = { ...DEMO_PAYOUT };
    store[email] = next;
    await writeJson(filePath, store);
    return;
  }

  store[email] = [DEMO_PAYOUT, ...existing];
  await writeJson(filePath, store);
}

async function restoreDemoReadState(): Promise<void> {
  const filePath = path.join(DATA_DIR, "admin-read-state.json");
  const state = await readJson<AdminReadState>(filePath, {
    notifications: {},
    payouts: {},
    campaigns: {},
  });
  const scrubbed = withoutDemoReadEntries(state);

  const before = JSON.stringify(state);
  const after = JSON.stringify(scrubbed);
  if (before !== after) {
    await writeJson(filePath, scrubbed);
  }
}

/** Re-seed demo admin notification fixtures so they reappear after refresh (testing only). */
export async function restoreAdminDemoNotificationFixtures(): Promise<void> {
  if (!isAdminDemoNotificationLoopEnabled()) return;

  await Promise.all([
    restoreDemoAccounts(),
    restoreDemoPanelists(),
    restoreDemoPayout(),
    restoreDemoReadState(),
  ]);
}
