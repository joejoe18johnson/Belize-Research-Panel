import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { CreateCampaignInput, CampaignRecord } from "./campaign-targeting";
import { resolveCampaignAudience } from "./campaign-targeting";
import { loadSurveyRecordsFromFile, saveSurveyRecordsToFile } from "./panelist-surveys-store";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "campaigns.json");

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function loadCampaignRecords(): Promise<CampaignRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as CampaignRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCampaignRecords(campaigns: CampaignRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(campaigns, null, 2), "utf-8");
}

export async function createAndLaunchCampaign(
  input: CreateCampaignInput,
  panelists: PanelistRow[]
): Promise<{ campaign: CampaignRecord; assignedCount: number; skippedCount: number }> {
  const title = cleanText(input.title);
  if (!title) throw new Error("Campaign title is required.");
  if (!input.surveyUrl.trim()) throw new Error("Survey URL is required.");
  if (!input.assignedDate || !input.completeByDate) throw new Error("Assigned and due dates are required.");

  const audience = resolveCampaignAudience(panelists, input.targeting);
  if (audience.length === 0) throw new Error("No panelists match the selected targeting.");

  const campaigns = await loadCampaignRecords();
  const assignments = await loadSurveyRecordsFromFile();

  const baseId = `campaign-${slugify(title) || "survey"}-${Date.now().toString(36)}`;
  const id = campaigns.some((campaign) => campaign.id === baseId)
    ? `${baseId}-${randomUUID().slice(0, 6)}`
    : baseId;

  const now = new Date().toISOString();
  const campaign: CampaignRecord = {
    id,
    title,
    description: cleanText(input.description),
    category: input.category,
    status: "active",
    surveyUrl: cleanText(input.surveyUrl),
    points: Math.max(0, input.points),
    assignedDate: input.assignedDate,
    completeByDate: input.completeByDate,
    deliveryMethod: cleanText(input.deliveryMethod) || "External Survey Link",
    targeting: input.targeting,
    createdAt: now,
    launchedAt: now,
  };

  const existingKeys = new Set(
    assignments.map((record) => `${record.id}:${cleanText(record.panelistEmail).toLowerCase()}`)
  );

  let assignedCount = 0;
  let skippedCount = 0;
  const nextAssignments = [...assignments];

  for (const panelist of audience) {
    const email = cleanText(panelist.email).toLowerCase();
    if (!email) continue;
    const key = `${id}:${email}`;
    if (existingKeys.has(key)) {
      skippedCount += 1;
      continue;
    }

    nextAssignments.push({
      id,
      title: campaign.title,
      category: campaign.category,
      assignedDate: campaign.assignedDate,
      completeByDate: campaign.completeByDate,
      points: campaign.points,
      status: "available",
      progressPercent: 0,
      completedDate: null,
      surveyUrl: campaign.surveyUrl,
      panelistEmail: email,
    });
    existingKeys.add(key);
    assignedCount += 1;
  }

  if (assignedCount === 0) {
    throw new Error("All targeted panelists already have this campaign assigned.");
  }

  campaigns.push(campaign);
  await saveCampaignRecords(campaigns);
  await saveSurveyRecordsToFile(nextAssignments);

  return { campaign, assignedCount, skippedCount };
}

export type {
  CampaignAssignmentDetail,
  CampaignRecord,
  CampaignStatus,
  CampaignSummary,
  CampaignTargetMode,
  CampaignTargeting,
  CreateCampaignInput,
} from "./campaign-targeting";

export {
  buildCampaignAssignmentDetails,
  buildCampaignSummaries,
  CAMPAIGN_TARGET_OPTIONS,
  countCampaignAudience,
  resolveCampaignAudience,
  targetingLabel,
} from "./campaign-targeting";
