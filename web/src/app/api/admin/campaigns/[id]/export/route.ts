import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { buildCampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { buildCampaignResultsCsv, campaignExportFilename } from "@/lib/campaign-results-export";
import { loadCampaignRecords } from "@/lib/campaigns";
import { targetingLabel } from "@/lib/campaign-targeting";
import { loadPanelists } from "@/lib/panelists";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import { loadSurveyResponsesForCampaign } from "@/lib/survey-responses";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
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

  const csv = buildCampaignResultsCsv({
    snapshot,
    surveyDefinition,
    responses,
    panelistMap: panelistByEmailMap(panelists),
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${campaignExportFilename(id, "csv")}"`,
    },
  });
}
