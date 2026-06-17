import { AdminCampaignsDashboard } from "@/components/admin/campaigns/AdminCampaignsDashboard";
import {
  buildCampaignAssignmentDetails,
  buildCampaignSummaries,
  loadCampaignRecords,
} from "@/lib/campaigns";
import { panelistByEmailMap } from "@/lib/admin-data-hub";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Campaigns | Admin",
};

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  const { campaign: campaignId } = await searchParams;
  const [campaigns, assignments, panelists] = await Promise.all([
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
    loadPanelists(),
  ]);

  const summaries = buildCampaignSummaries(campaigns, assignments);
  const selectedCampaignId = campaignId && summaries.some((row) => row.id === campaignId) ? campaignId : null;
  const assignmentDetails = selectedCampaignId
    ? buildCampaignAssignmentDetails(selectedCampaignId, assignments, panelistByEmailMap(panelists))
    : [];

  return (
    <AdminCampaignsDashboard
      summaries={summaries}
      selectedCampaignId={selectedCampaignId}
      assignmentDetails={assignmentDetails}
    />
  );
}
