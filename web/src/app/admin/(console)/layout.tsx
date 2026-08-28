import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildCampaignSummaries } from "@/lib/campaign-targeting";
import { loadCampaignRecords } from "@/lib/campaigns";
import { restoreAdminDemoNotificationFixtures } from "@/lib/admin-demo-notification-loop";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { buildAdminNavBadges } from "@/lib/admin-nav-badges";
import { loadAdminReadState } from "@/lib/admin-read-state";
import { loadPanelistPhotoUploadUsernames } from "@/lib/panelist-requirement-context";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { countUnreadSupportMessages, loadSupportMessages } from "@/lib/support-messages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  await restoreAdminDemoNotificationFixtures();
  const [hub, readState, campaigns, assignments, photoUploadUsernames, supportMessages] = await Promise.all([
    loadAdminDataHub(),
    loadAdminReadState(),
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
    loadPanelistPhotoUploadUsernames(),
    loadSupportMessages(),
  ]);
  const campaignSummaries = buildCampaignSummaries(campaigns, assignments);
  const navBadges = buildAdminNavBadges(hub, readState, campaignSummaries, {
    photoUploadUsernames,
    unreadSupportCount: countUnreadSupportMessages(supportMessages),
  });

  return (
    <AdminShell session={session} navBadges={navBadges}>
      {children}
    </AdminShell>
  );
}
