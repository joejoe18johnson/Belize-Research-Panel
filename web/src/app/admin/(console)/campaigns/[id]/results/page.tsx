import { notFound } from "next/navigation";
import { AdminCampaignResultsClient } from "@/components/admin/campaigns/AdminCampaignResultsClient";
import { AdminCampaignResultsSeenEffect } from "@/components/admin/campaigns/AdminCampaignResultsSeenEffect";
import { buildCampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { loadCampaignRecords } from "@/lib/campaigns";
import { targetingLabel } from "@/lib/campaign-targeting";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { loadPanelists } from "@/lib/panelists";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import { loadSurveyResponsesForCampaign } from "@/lib/survey-responses";

export const metadata = {
  title: "Campaign results | Admin",
};

export default async function AdminCampaignResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [campaigns, assignments, panelists, responses] = await Promise.all([
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
    loadPanelists(),
    loadSurveyResponsesForCampaign(id),
  ]);

  const campaign = campaigns.find((row) => row.id === id);
  if (!campaign) notFound();

  const surveyDefinition =
    campaign.surveyDefinitionId ? await findSurveyDefinitionById(campaign.surveyDefinitionId) : null;

  const snapshot = buildCampaignResultsSnapshot({
    campaign,
    targetingLabel: targetingLabel(campaign.targeting),
    assignments,
    responses,
    panelistMap: panelistByEmailMap(panelists),
    surveyDefinition,
  });

  return (
    <>
      <AdminCampaignResultsSeenEffect campaignId={id} />
      <AdminCampaignResultsClient snapshot={snapshot} />
    </>
  );
}
