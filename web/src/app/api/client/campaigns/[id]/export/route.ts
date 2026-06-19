import { NextResponse } from "next/server";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { buildCampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { buildCampaignResultsCsv, campaignExportFilename } from "@/lib/campaign-results-export";
import { getClientSession } from "@/lib/client-auth";
import { loadClientCampaigns, campaignOwnedByClient } from "@/lib/client-access";
import { redactCampaignResultsForClient } from "@/lib/client-results-snapshot";
import { targetingLabel } from "@/lib/campaign-targeting";
import { loadPanelists } from "@/lib/panelists";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import { loadSurveyResponsesForCampaign } from "@/lib/survey-responses";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const campaigns = await loadClientCampaigns(session.clientId);
  const campaign = campaigns.find((row) => row.id === id);
  if (!campaign || !campaignOwnedByClient(campaign, session.clientId)) {
    return NextResponse.json({ message: "Campaign not found." }, { status: 404 });
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

  const csv = buildCampaignResultsCsv({
    snapshot,
    surveyDefinition,
    responses: responses.filter((record) => record.submittedAt),
    panelistMap: panelistByEmailMap(panelists),
    clientSafe: true,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${campaignExportFilename(id, "csv")}"`,
    },
  });
}
