import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const REDEMPTION_FILE = path.join(DATA_DIR, "redemption-requests.json");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "campaigns.json");
const SURVEYS_FILE = path.join(DATA_DIR, "panelist-surveys.json");
const READ_STATE_FILE = path.join(DATA_DIR, "admin-read-state.json");

const DEMO_REQUESTED_AT = "2026-06-17T10:00:00.000Z";

const DEMO_ACCOUNT_PATCHES = {
  "panelist.verified@belizepanel.test": {
    pending_email: "panelist.verified.new@belizepanel.test",
    email_change_requested_at: DEMO_REQUESTED_AT,
  },
  "panelist.pending@belizepanel.test": {
    pending_phone_whatsapp: "+501 622-3344",
    phone_change_requested_at: DEMO_REQUESTED_AT,
  },
  "panelist.signup@belizepanel.test": {
    email_verified: "false",
    verification_token: "demo-signup-verify-token",
  },
};

const DEMO_PAYOUT = {
  id: "demo-payout-pending-glen",
  email: "glen.avilez@belizepanel.test",
  optionId: "gift_card",
  optionLabel: "Gift card",
  points: 500,
  amountBz: 20,
  valueLabel: "BZ$20 gift card",
  status: "pending",
  details: {
    retailer: "Brodi's",
    deliveryEmail: "glen.avilez@belizepanel.test",
  },
  notes: "Demo payout for admin notification preview.",
  submittedAt: DEMO_REQUESTED_AT,
  updatedAt: DEMO_REQUESTED_AT,
};

const DEMO_CAMPAIGN = {
  id: "campaign-demo-admin-alert",
  title: "Demo admin alert — community priorities",
  description: "Sample completed campaign for admin notification and badge preview.",
  category: "civic",
  status: "closed",
  surveyUrl: "",
  surveyDefinitionId: "survey-demo-admin-alert",
  deliveryType: "internal",
  points: 75,
  assignedDate: "2026-06-10",
  completeByDate: "2026-06-16",
  deliveryMethod: "On-site survey",
  targeting: {
    mode: "specific_emails",
    emails: ["glen.avilez@belizepanel.test"],
  },
  createdAt: "2026-06-10T12:00:00.000Z",
  launchedAt: "2026-06-10T12:00:00.000Z",
  closedAt: "2026-06-16T18:00:00.000Z",
};

const DEMO_ASSIGNMENT = {
  id: DEMO_CAMPAIGN.id,
  title: DEMO_CAMPAIGN.title,
  category: DEMO_CAMPAIGN.category,
  assignedDate: DEMO_CAMPAIGN.assignedDate,
  completeByDate: DEMO_CAMPAIGN.completeByDate,
  points: DEMO_CAMPAIGN.points,
  status: "completed",
  progressPercent: 100,
  completedDate: "2026-06-16",
  surveyUrl: null,
  surveyDefinitionId: DEMO_CAMPAIGN.surveyDefinitionId,
  deliveryType: "internal",
  panelistEmail: "glen.avilez@belizepanel.test",
};

const DEMO_UNREAD_NOTIFICATION_IDS = [
  "email change:panelist.verified@belizepanel.test",
  "phone change:panelist.pending@belizepanel.test",
  "email verification:panelist.signup@belizepanel.test",
];

async function readJson(file, fallback) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf-8"));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function patchAccounts() {
  const accounts = await readJson(ACCOUNTS_FILE, []);
  if (!Array.isArray(accounts)) return;

  const patched = accounts.map((account) => {
    const email = String(account.email ?? "").toLowerCase();
    const patch = DEMO_ACCOUNT_PATCHES[email];
    if (!patch) return account;
    return { ...account, ...patch };
  });

  await writeFile(ACCOUNTS_FILE, JSON.stringify(patched, null, 2), "utf-8");
}

async function patchRedemptions() {
  const store = await readJson(REDEMPTION_FILE, {});
  const email = DEMO_PAYOUT.email;
  const existing = Array.isArray(store[email]) ? store[email] : [];
  const withoutDemo = existing.filter((request) => request.id !== DEMO_PAYOUT.id);
  store[email] = [DEMO_PAYOUT, ...withoutDemo];
  await writeFile(REDEMPTION_FILE, JSON.stringify(store, null, 2), "utf-8");
}

async function patchCampaignDemo() {
  let campaigns = await readJson(CAMPAIGNS_FILE, []);
  let surveys = await readJson(SURVEYS_FILE, []);
  if (!Array.isArray(campaigns)) campaigns = [];
  if (!Array.isArray(surveys)) surveys = [];

  const campaignIndex = campaigns.findIndex((campaign) => campaign.id === DEMO_CAMPAIGN.id);
  if (campaignIndex >= 0) campaigns[campaignIndex] = DEMO_CAMPAIGN;
  else campaigns.push(DEMO_CAMPAIGN);

  const assignmentIndex = surveys.findIndex(
    (record) =>
      record.id === DEMO_CAMPAIGN.id &&
      String(record.panelistEmail).toLowerCase() === DEMO_ASSIGNMENT.panelistEmail.toLowerCase()
  );
  if (assignmentIndex >= 0) surveys[assignmentIndex] = { ...surveys[assignmentIndex], ...DEMO_ASSIGNMENT };
  else surveys.push(DEMO_ASSIGNMENT);

  await writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), "utf-8");
  await writeFile(SURVEYS_FILE, JSON.stringify(surveys, null, 2), "utf-8");
}

async function resetDemoUnreadState() {
  const state = await readJson(READ_STATE_FILE, {
    notifications: {},
    payouts: {},
    campaigns: {},
  });

  for (const id of DEMO_UNREAD_NOTIFICATION_IDS) {
    delete state.notifications?.[id];
  }

  delete state.payouts?.[DEMO_PAYOUT.id];
  delete state.campaigns?.[DEMO_CAMPAIGN.id];

  await writeFile(
    READ_STATE_FILE,
    JSON.stringify(
      {
        notifications: state.notifications ?? {},
        payouts: state.payouts ?? {},
        campaigns: state.campaigns ?? {},
      },
      null,
      2
    ),
    "utf-8"
  );
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  await patchAccounts();
  await patchRedemptions();
  await patchCampaignDemo();
  await resetDemoUnreadState();

  console.log("Admin notification demo data seeded.");
  console.log("\nNotifications queue (unread):");
  for (const id of DEMO_UNREAD_NOTIFICATION_IDS) {
    console.log(`  ${id}`);
  }
  console.log(`\nPayouts queue (unread): ${DEMO_PAYOUT.id}`);
  console.log(`Campaigns alert (unread): ${DEMO_CAMPAIGN.id}`);
  console.log("\nVisit /admin/notifications, /admin/payouts, and /admin/campaigns to preview badges and read rules.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
