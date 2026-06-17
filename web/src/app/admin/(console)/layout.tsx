import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildCampaignSummaries } from "@/lib/campaign-targeting";
import { loadCampaignRecords } from "@/lib/campaigns";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { buildAdminNavBadges } from "@/lib/admin-nav-badges";
import { loadAdminReadState } from "@/lib/admin-read-state";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  const [hub, readState, campaigns, assignments] = await Promise.all([
    loadAdminDataHub(),
    loadAdminReadState(),
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
  ]);
  const campaignSummaries = buildCampaignSummaries(campaigns, assignments);
  const navBadges = buildAdminNavBadges(hub, readState, campaignSummaries);

  return (
    <AdminShell session={session} navBadges={navBadges}>
      {children}
    </AdminShell>
  );
}
