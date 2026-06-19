import { notFound } from "next/navigation";
import { buildCampaignSummaries, loadCampaignRecords, type CampaignRecord, type CampaignSummary } from "./campaigns";
import type { ClientSession } from "./client-session";
import { loadSurveyRecordsFromFile } from "./panelist-surveys-store";

export async function loadClientCampaigns(clientId: string): Promise<CampaignRecord[]> {
  const campaigns = await loadCampaignRecords();
  return campaigns.filter((campaign) => campaign.clientId === clientId);
}

export async function loadClientCampaignSummaries(clientId: string): Promise<CampaignSummary[]> {
  const [campaigns, assignments] = await Promise.all([loadCampaignRecords(), loadSurveyRecordsFromFile()]);
  const clientCampaigns = campaigns.filter((campaign) => campaign.clientId === clientId);
  return buildCampaignSummaries(clientCampaigns, assignments);
}

export async function requireClientCampaign(
  session: ClientSession,
  campaignId: string
): Promise<CampaignRecord> {
  const campaigns = await loadClientCampaigns(session.clientId);
  const campaign = campaigns.find((row) => row.id === campaignId);
  if (!campaign) notFound();
  return campaign;
}
