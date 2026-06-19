import { AdminCampaignResultsClient } from "@/components/admin/campaigns/AdminCampaignResultsClient";
import { buildCampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { requireClientSession } from "@/lib/client-auth";
import { requireClientCampaign } from "@/lib/client-access";
import { redactCampaignResultsForClient } from "@/lib/client-results-snapshot";
import { targetingLabel } from "@/lib/campaign-targeting";
import { loadPanelists } from "@/lib/panelists";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import { loadSurveyResponsesForCampaign } from "@/lib/survey-responses";

export const metadata = {
  title: "Campaign results | Client portal",
};

export default async function ClientCampaignResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireClientSession();
  const campaign = await requireClientCampaign(session, id);

  const [assignments, panelists, responses] = await Promise.all([
    loadSurveyRecordsFromFile(),
    loadPanelists(),
    loadSurveyResponsesForCampaign(id),
  ]);

  const surveyDefinition =
    campaign.surveyDefinitionId ? await findSurveyDefinitionById(campaign.surveyDefinitionId) : null;

  const snapshot = redactCampaignResultsForClient(
    buildCampaignResultsSnapshot({
      campaign,
      targetingLabel: targetingLabel(campaign.targeting),
      assignments,
      responses,
      panelistMap: panelistByEmailMap(panelists),
      surveyDefinition,
    })
  );

  return (
    <AdminCampaignResultsClient
      snapshot={snapshot}
      audience="client"
      exportBasePath={`/api/client/campaigns/${encodeURIComponent(id)}/export`}
      backHref="/client"
      backLabel="Back to my campaigns"
    />
  );
}
