import { AdminCreateCampaignClient } from "@/components/admin/campaigns/AdminCreateCampaignClient";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Create Campaign | Admin",
};

export default async function AdminCreateCampaignPage() {
  const panelists = await loadPanelists();
  return <AdminCreateCampaignClient panelists={panelists} />;
}
