import { AdminCampaignsDashboard } from "@/components/admin/campaigns/AdminCampaignsDashboard";
import { unreadCompletedCampaignIds } from "@/lib/admin-nav-badges";
import { buildCampaignSummaries } from "@/lib/campaign-targeting";
import { loadCampaignRecords } from "@/lib/campaigns";
import { loadAdminReadState } from "@/lib/admin-read-state";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";

export const metadata = {
  title: "Campaigns | Admin",
};

export default async function AdminCampaignsPage() {
  const [campaigns, assignments, readState] = await Promise.all([
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
    loadAdminReadState(),
  ]);
  const summaries = buildCampaignSummaries(campaigns, assignments);
  const unreadCampaignIds = unreadCompletedCampaignIds(summaries, readState);

  return <AdminCampaignsDashboard summaries={summaries} unreadCampaignIds={unreadCampaignIds} />;
}
