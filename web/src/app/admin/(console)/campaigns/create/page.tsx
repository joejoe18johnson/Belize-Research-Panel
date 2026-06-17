import { AdminCreateCampaignClient } from "@/components/admin/campaigns/AdminCreateCampaignClient";
import { listPublishedSurveyDefinitions } from "@/lib/survey-definitions";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Create Campaign | Admin",
};

export default async function AdminCreateCampaignPage() {
  const [panelists, publishedSurveys] = await Promise.all([loadPanelists(), listPublishedSurveyDefinitions()]);
  return <AdminCreateCampaignClient panelists={panelists} publishedSurveys={publishedSurveys} />;
}
