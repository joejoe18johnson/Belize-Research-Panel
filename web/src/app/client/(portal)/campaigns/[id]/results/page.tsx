import { AdminCampaignResultsClient } from "@/components/admin/campaigns/AdminCampaignResultsClient";
import { ClientCampaignUnavailable } from "@/components/client/ClientCampaignUnavailable";
import { buildCampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { requireClientSession } from "@/lib/client-auth";
import { getClientCampaign } from "@/lib/client-access";
import { redactCampaignResultsForClient } from "@/lib/client-results-snapshot";
import { targetingLabel } from "@/lib/campaign-targeting";
import { loadPanelists } from "@/lib/panelists";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import { loadSurveyResponsesForCampaign } from "@/lib/survey-responses";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campaign results | Client portal",
};

export default async function ClientCampaignResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireClientSession();
  const campaign = await getClientCampaign(session, id);
  if (!campaign) {
    return <ClientCampaignUnavailable campaignId={id} />;
  }

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
      clientName={session.organizationName}
      exportBasePath={`/api/client/campaigns/${encodeURIComponent(id)}/export`}
      backHref="/client"
      backLabel="Back to my campaigns"
    />
  );
}
