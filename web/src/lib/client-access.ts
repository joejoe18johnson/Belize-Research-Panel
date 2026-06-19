import { notFound } from "next/navigation";
import { buildCampaignSummaries, loadCampaignRecords, type CampaignRecord, type CampaignSummary } from "./campaigns";
import type { ClientSession } from "./client-session";
import { loadSurveyRecordsFromFile } from "./panelist-surveys-store";
import { cleanText } from "./validation";

function normalizeClientId(clientId: string): string {
  return cleanText(clientId);
}

/** A campaign is visible to a client only when explicitly linked via clientId. */
export function campaignOwnedByClient(campaign: CampaignRecord, clientId: string): boolean {
  const ownerId = cleanText(campaign.clientId ?? "");
  return Boolean(ownerId) && ownerId === normalizeClientId(clientId);
}

export async function loadClientCampaigns(clientId: string): Promise<CampaignRecord[]> {
  const normalizedId = normalizeClientId(clientId);
  const campaigns = await loadCampaignRecords();
  return campaigns.filter((campaign) => campaignOwnedByClient(campaign, normalizedId));
}

export async function loadClientCampaignSummaries(clientId: string): Promise<CampaignSummary[]> {
  const normalizedId = normalizeClientId(clientId);
  const [campaigns, assignments] = await Promise.all([loadCampaignRecords(), loadSurveyRecordsFromFile()]);
  const clientCampaigns = campaigns.filter((campaign) => campaignOwnedByClient(campaign, normalizedId));
  const clientCampaignIds = new Set(clientCampaigns.map((campaign) => campaign.id));
  const clientAssignments = assignments.filter((record) => clientCampaignIds.has(record.id));

  return buildCampaignSummaries(clientCampaigns, clientAssignments).filter((summary) =>
    clientCampaignIds.has(summary.id)
  );
}

export async function getClientCampaign(
  session: ClientSession,
  campaignId: string
): Promise<CampaignRecord | null> {
  const campaigns = await loadClientCampaigns(session.clientId);
  return campaigns.find((row) => row.id === campaignId) ?? null;
}

export async function requireClientCampaign(
  session: ClientSession,
  campaignId: string
): Promise<CampaignRecord> {
  const campaign = await getClientCampaign(session, campaignId);
  if (!campaign) notFound();
  return campaign;
}
