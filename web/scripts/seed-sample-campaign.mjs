import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "campaigns.json");
const SURVEYS_FILE = path.join(DATA_DIR, "panelist-surveys.json");

const TARGET_EMAIL = "johannesjohnsonj@gmail.com";
const CAMPAIGN_ID = "campaign-sample-coastal-tourism-2026";
const SURVEY_DEFINITION_ID = "survey-belize-coastal-tourism-2026";

const SAMPLE_CAMPAIGN = {
  id: CAMPAIGN_ID,
  title: "Belize coastal tourism attitudes 2026",
  description:
    "Sample on-site survey campaign for panelist inbox preview. Share your views on tourism development, reef conservation, and visitor spending along Belize's coast.",
  category: "market",
  status: "active",
  surveyUrl: "",
  surveyDefinitionId: SURVEY_DEFINITION_ID,
  deliveryType: "internal",
  points: 125,
  assignedDate: "2026-06-16",
  completeByDate: "2026-06-30",
  deliveryMethod: "On-site survey",
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
  surveyUrl: null,
  surveyDefinitionId: SURVEY_DEFINITION_ID,
  deliveryType: "internal",
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

  let campaigns = await readJson(CAMPAIGNS_FILE, []);
  let surveys = await readJson(SURVEYS_FILE, []);

  const campaignIndex = campaigns.findIndex((campaign) => campaign.id === CAMPAIGN_ID);
  if (campaignIndex >= 0) campaigns[campaignIndex] = SAMPLE_CAMPAIGN;
  else campaigns.push(SAMPLE_CAMPAIGN);

  const assignmentIndex = surveys.findIndex(
    (record) =>
      record.id === CAMPAIGN_ID && String(record.panelistEmail).toLowerCase() === TARGET_EMAIL.toLowerCase()
  );
  if (assignmentIndex >= 0) surveys[assignmentIndex] = { ...surveys[assignmentIndex], ...SAMPLE_ASSIGNMENT };
  else surveys.push(SAMPLE_ASSIGNMENT);

  await writeFile(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), "utf-8");
  await writeFile(SURVEYS_FILE, JSON.stringify(surveys, null, 2), "utf-8");

  console.log("Sample on-site campaign ready:", SAMPLE_CAMPAIGN.title);
  console.log("\nPanelist login:");
  console.log(`  Email: ${TARGET_EMAIL}`);
  console.log("  Password: DemoPass1!");
  console.log("\nOpen Dashboard → Surveys → Start survey (on-site, no external link).");
  console.log(`Take survey: /dashboard/surveys/${CAMPAIGN_ID}`);
  console.log(`Admin builder: /admin/surveys`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
