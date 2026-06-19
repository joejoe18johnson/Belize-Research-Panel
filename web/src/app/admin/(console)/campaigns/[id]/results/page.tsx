import { notFound } from "next/navigation";
import { AdminCampaignClientAssignment } from "@/components/admin/campaigns/AdminCampaignClientAssignment";
import { AdminCampaignResultsClient } from "@/components/admin/campaigns/AdminCampaignResultsClient";
import { AdminCampaignResultsSeenEffect } from "@/components/admin/campaigns/AdminCampaignResultsSeenEffect";
import { buildCampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { loadCampaignRecords } from "@/lib/campaigns";
import { targetingLabel } from "@/lib/campaign-targeting";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { listClientUsers } from "@/lib/client-users";
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
  const [campaigns, assignments, panelists, responses, clients] = await Promise.all([
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
    loadPanelists(),
    loadSurveyResponsesForCampaign(id),
    listClientUsers(),
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
      <div className="mx-auto max-w-[1400px] space-y-6">
        <AdminCampaignClientAssignment campaignId={id} clientId={campaign.clientId} clients={clients} />
        <AdminCampaignResultsClient
          snapshot={snapshot}
          exportBasePath={`/api/admin/campaigns/${encodeURIComponent(id)}/export`}
        />
      </div>
    </>
  );
}
