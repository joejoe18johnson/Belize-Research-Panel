import { AdminCampaignsDashboard } from "@/components/admin/campaigns/AdminCampaignsDashboard";
import { buildCampaignSummaries } from "@/lib/campaign-targeting";
import { loadCampaignRecords } from "@/lib/campaigns";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";

export const metadata = {
  title: "Campaigns | Admin",
};

export default async function AdminCampaignsPage() {
  const [campaigns, assignments] = await Promise.all([loadCampaignRecords(), loadSurveyRecordsFromFile()]);
  const summaries = buildCampaignSummaries(campaigns, assignments);

  return <AdminCampaignsDashboard summaries={summaries} />;
}
