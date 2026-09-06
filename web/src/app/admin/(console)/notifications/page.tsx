import { Suspense } from "react";
import { InlinePanelSkeleton } from "@/components/shared/PageSkeletons";
import { AdminNotificationsDashboard } from "@/components/admin/queues/AdminNotificationsDashboard";
import { buildCampaignSummaries } from "@/lib/campaign-targeting";
import { loadCampaignRecords } from "@/lib/campaigns";
import { buildNotificationQueueRows, buildUnderReviewRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { unreadAdminNotificationIds, unreadCompletedCampaignIds } from "@/lib/admin-nav-badges";
import { isAdminDemoNotificationLoopEnabled } from "@/lib/admin-demo-notification-loop";
import { loadAdminReadState } from "@/lib/admin-read-state";
import { loadPanelistPhotoUploadUsernames } from "@/lib/panelist-requirement-context";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";

export const metadata = {
  title: "Notifications | Admin",
};

export default async function AdminNotificationsPage() {
  const [hub, readState, campaigns, assignments, photoUploadUsernames] = await Promise.all([
    loadAdminDataHub(),
    loadAdminReadState(),
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
    loadPanelistPhotoUploadUsernames(),
  ]);
  const campaignSummaries = buildCampaignSummaries(campaigns, assignments);
  const rows = buildNotificationQueueRows(hub);
  const unreadIds = unreadAdminNotificationIds(hub, readState);
  const scopeCounts = {
    notifications: rows.length,
    payouts: hub.redemptionRequests.filter((request) => request.status === "pending").length,
    campaigns: unreadCompletedCampaignIds(campaignSummaries, readState).length,
    "under-review": buildUnderReviewRows(hub, photoUploadUsernames).length,
  };

  return (
    <Suspense fallback={<InlinePanelSkeleton rows={5} />}>
      <AdminNotificationsDashboard
        rows={rows}
        unreadIds={unreadIds}
        scopeCounts={scopeCounts}
        demoLoopEnabled={isAdminDemoNotificationLoopEnabled()}
      />
    </Suspense>
  );
}
