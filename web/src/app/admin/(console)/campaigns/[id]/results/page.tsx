import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminCampaignResultsClient } from "@/components/admin/campaigns/AdminCampaignResultsClient";
import { buildCampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { loadCampaignRecords } from "@/lib/campaigns";
import { targetingLabel } from "@/lib/campaign-targeting";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { markAdminCampaignsRead } from "@/lib/admin-read-state";
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

  await markAdminCampaignsRead([id]);
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/campaigns");

  return <AdminCampaignResultsClient snapshot={snapshot} />;
}
