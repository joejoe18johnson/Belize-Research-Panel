import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "campaigns.json");
const SURVEYS_FILE = path.join(DATA_DIR, "panelist-surveys.json");

const TARGET_EMAIL = "johannesjohnsonj@gmail.com";
const CAMPAIGN_ID = "campaign-sample-coastal-tourism-2026";

const SAMPLE_CAMPAIGN = {
  id: CAMPAIGN_ID,
  title: "Belize coastal tourism attitudes 2026",
  description:
    "Sample campaign for panelist inbox preview. Share your views on tourism development, reef conservation, and visitor spending along Belize's coast.",
  category: "market",
  status: "active",
  surveyUrl: "https://forms.gle/sample-belize-coastal-tourism-2026",
  points: 125,
  assignedDate: "2026-06-16",
  completeByDate: "2026-06-30",
  deliveryMethod: "External Survey Link",
  targeting: {
    mode: "specific_emails",
    emails: [TARGET_EMAIL],
  },
  createdAt: "2026-06-16T12:00:00.000Z",
  launchedAt: "2026-06-16T12:00:00.000Z",
};

const SAMPLE_ASSIGNMENT = {
  id: CAMPAIGN_ID,
  title: SAMPLE_CAMPAIGN.title,
  category: SAMPLE_CAMPAIGN.category,
  assignedDate: SAMPLE_CAMPAIGN.assignedDate,
  completeByDate: SAMPLE_CAMPAIGN.completeByDate,
  points: SAMPLE_CAMPAIGN.points,
  status: "available",
  progressPercent: 0,
  completedDate: null,
  surveyUrl: SAMPLE_CAMPAIGN.surveyUrl,
  panelistEmail: TARGET_EMAIL,
};

async function readJson(file, fallback) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf-8"));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });

  const campaigns = await readJson(CAMPAIGNS_FILE, []);
  const surveys = await readJson(SURVEYS_FILE, []);

  const campaignExists = campaigns.some((campaign) => campaign.id === CAMPAIGN_ID);
  const assignmentExists = surveys.some(
    (record) =>
      record.id === CAMPAIGN_ID && String(record.panelistEmail).toLowerCase() === TARGET_EMAIL.toLowerCase()
  );

  if (!campaignExists) {
    campaigns.push(SAMPLE_CAMPAIGN);
    await writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), "utf-8");
    console.log("Created sample campaign:", SAMPLE_CAMPAIGN.title);
  } else {
    console.log("Sample campaign already exists:", SAMPLE_CAMPAIGN.title);
  }

  if (!assignmentExists) {
    surveys.push(SAMPLE_ASSIGNMENT);
    await writeFile(SURVEYS_FILE, JSON.stringify(surveys, null, 2), "utf-8");
    console.log(`Assigned campaign to ${TARGET_EMAIL}`);
  } else {
    console.log(`Assignment already exists for ${TARGET_EMAIL}`);
  }

  console.log("\nPanelist login:");
  console.log(`  Email: ${TARGET_EMAIL}`);
  console.log("  Password: DemoPass1!");
  console.log("\nThen open Dashboard → Surveys to see the new inbox invitation.");
  console.log(`Admin view: /admin/campaigns?campaign=${encodeURIComponent(CAMPAIGN_ID)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
