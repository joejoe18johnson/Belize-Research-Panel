import { AdminCreateCampaignClient } from "@/components/admin/campaigns/AdminCreateCampaignClient";
import { listClientUsers } from "@/lib/client-users";
import { listPublishedSurveyDefinitions } from "@/lib/survey-definitions";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Create Campaign | Admin",
};

export default async function AdminCreateCampaignPage() {
  const [panelists, publishedSurveys, clients] = await Promise.all([
    loadPanelists(),
    listPublishedSurveyDefinitions(),
    listClientUsers(),
  ]);
  return <AdminCreateCampaignClient panelists={panelists} publishedSurveys={publishedSurveys} clients={clients} />;
}
