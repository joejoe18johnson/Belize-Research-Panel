import { ClientCampaignsDashboard } from "@/components/client/ClientCampaignsDashboard";
import { requireClientSession } from "@/lib/client-auth";
import { loadClientCampaignSummaries } from "@/lib/client-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My campaigns | Client portal",
};

export default async function ClientDashboardPage() {
  const session = await requireClientSession();
  const campaigns = await loadClientCampaignSummaries(session.clientId);

  return <ClientCampaignsDashboard organizationName={session.organizationName} campaigns={campaigns} />;
}
