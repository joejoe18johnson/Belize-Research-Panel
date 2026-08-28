import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { CreateCampaignInput, CampaignRecord } from "./campaign-targeting";
import { resolveCampaignAudience } from "./campaign-targeting";
import { findPanelistGroupById } from "./panelist-groups";
import { findSurveyDefinitionById } from "./survey-definitions";
import { saveNewSurveyAssignments } from "./panelist-surveys-store";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";
import { resolveSurveyBy } from "./campaign-survey-by";

const DATA_FILE = path.join(process.cwd(), "data", "campaigns.json");

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function loadCampaignRecords(): Promise<CampaignRecord[]> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadCampaigns } = await import("./supabase/repos");
    return supabaseLoadCampaigns();
  }
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as CampaignRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveCampaignRecords(campaigns: CampaignRecord[]): Promise<void> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseUpsertCampaigns } = await import("./supabase/repos");
    await supabaseUpsertCampaigns(campaigns);
    return;
  }
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(campaigns, null, 2), "utf-8");
}

export async function createAndLaunchCampaign(
  input: CreateCampaignInput,
  panelists: PanelistRow[]
): Promise<{
  campaign: CampaignRecord;
  assignedCount: number;
  skippedCount: number;
  assignedPanelists: PanelistRow[];
}> {
  const title = cleanText(input.title);
  if (!title) throw new Error("Campaign title is required.");
  if (!input.assignedDate || !input.completeByDate) throw new Error("Assigned and due dates are required.");

  const deliveryType = input.deliveryType === "internal" ? "internal" : "external";
  let surveyDefinitionId = cleanText(input.surveyDefinitionId ?? "");
  let surveyUrl = cleanText(input.surveyUrl ?? "");

  if (deliveryType === "internal") {
    if (!surveyDefinitionId) throw new Error("Select an on-site survey to launch.");
    const definition = await findSurveyDefinitionById(surveyDefinitionId);
    if (!definition) throw new Error("Selected survey was not found.");
    if (definition.status !== "published") throw new Error("Only published surveys can be launched.");
    surveyUrl = "";
  } else if (!surveyUrl) {
    throw new Error("Survey URL is required for external surveys.");
  } else {
    surveyDefinitionId = "";
  }

  let targeting = input.targeting;
  let resolvedGroup = null;
  if (targeting.mode === "panelist_group") {
    const groupId = cleanText(targeting.groupId ?? "");
    if (!groupId) throw new Error("Select a saved panelist group.");
    resolvedGroup = await findPanelistGroupById(groupId);
    if (!resolvedGroup) throw new Error("Selected panelist group was not found.");
    targeting = {
      ...targeting,
      groupId,
      groupName: resolvedGroup.name,
    };
  }

  const audience = resolveCampaignAudience(
    panelists,
    targeting,
    resolvedGroup ? { group: resolvedGroup } : undefined
  );
  if (audience.length === 0) throw new Error("No panelists match the selected targeting.");

  const campaigns = await loadCampaignRecords();

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
    surveyUrl,
    surveyDefinitionId: surveyDefinitionId || undefined,
    deliveryType,
    points: Math.max(0, input.points),
    assignedDate: input.assignedDate,
    completeByDate: input.completeByDate,
    deliveryMethod: cleanText(input.deliveryMethod) || (deliveryType === "internal" ? "On-site survey" : "External Survey Link"),
    targeting,
    clientId: cleanText(input.clientId ?? "") || undefined,
    coverImageFile: cleanText(input.coverImageFile ?? ""),
    logoFile: cleanText(input.logoFile ?? ""),
    surveyBy: resolveSurveyBy(input.surveyBy),
    createdAt: now,
    launchedAt: now,
  };

  const seenEmails = new Set<string>();
  let assignedCount = 0;
  let skippedCount = 0;
  const assignedPanelists: PanelistRow[] = [];
  const createdAssignments: PanelistSurveyRecord[] = [];

  for (const panelist of audience) {
    const email = cleanText(panelist.email).toLowerCase();
    if (!email) continue;
    if (seenEmails.has(email)) {
      skippedCount += 1;
      continue;
    }
    seenEmails.add(email);

    createdAssignments.push({
      id,
      title: campaign.title,
      category: campaign.category,
      assignedDate: campaign.assignedDate,
      completeByDate: campaign.completeByDate,
      points: campaign.points,
      status: "available",
      progressPercent: 0,
      completedDate: null,
      surveyUrl: deliveryType === "external" ? surveyUrl : null,
      surveyDefinitionId: deliveryType === "internal" ? surveyDefinitionId : null,
      deliveryType,
      panelistEmail: email,
      surveyBy: campaign.surveyBy,
    });
    assignedPanelists.push(panelist);
    assignedCount += 1;
  }

  if (assignedCount === 0) {
    throw new Error("No panelists could be assigned to this campaign.");
  }

  campaigns.push(campaign);
  await saveCampaignRecords(campaigns);
  await saveNewSurveyAssignments(createdAssignments);

  return { campaign, assignedCount, skippedCount, assignedPanelists };
}

export async function findCampaignById(campaignId: string): Promise<CampaignRecord | null> {
  const id = cleanText(campaignId);
  if (!id) return null;
  const campaigns = await loadCampaignRecords();
  return campaigns.find((campaign) => campaign.id === id) ?? null;
}

export async function updateCampaignBranding(
  campaignId: string,
  patch: { coverImageFile?: string; logoFile?: string }
): Promise<CampaignRecord | null> {
  const campaigns = await loadCampaignRecords();
  const index = campaigns.findIndex((campaign) => campaign.id === campaignId);
  if (index < 0) return null;
  campaigns[index] = {
    ...campaigns[index],
    coverImageFile:
      patch.coverImageFile !== undefined ? cleanText(patch.coverImageFile) : campaigns[index].coverImageFile ?? "",
    logoFile: patch.logoFile !== undefined ? cleanText(patch.logoFile) : campaigns[index].logoFile ?? "",
  };
  await saveCampaignRecords(campaigns);
  return campaigns[index];
}

export async function updateCampaignCoverImage(
  campaignId: string,
  coverImageFile: string
): Promise<CampaignRecord | null> {
  return updateCampaignBranding(campaignId, { coverImageFile: cleanText(coverImageFile) });
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
