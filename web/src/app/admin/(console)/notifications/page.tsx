import { Suspense } from "react";
import { AdminNotificationsDashboard } from "@/components/admin/queues/AdminNotificationsDashboard";
import { buildCampaignSummaries } from "@/lib/campaign-targeting";
import { loadCampaignRecords } from "@/lib/campaigns";
import { buildNotificationQueueRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import {
  unreadAdminNotificationIds,
  unreadCompletedCampaignIds,
  unreadNewPayoutIds,
} from "@/lib/admin-nav-badges";
import { isAdminDemoNotificationLoopEnabled } from "@/lib/admin-demo-notification-loop";
import { loadAdminReadState } from "@/lib/admin-read-state";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";

export const metadata = {
  title: "Notifications | Admin",
};

export default async function AdminNotificationsPage() {
  const [hub, readState, campaigns, assignments] = await Promise.all([
    loadAdminDataHub(),
    loadAdminReadState(),
    loadCampaignRecords(),
    loadSurveyRecordsFromFile(),
  ]);
  const campaignSummaries = buildCampaignSummaries(campaigns, assignments);
  const rows = buildNotificationQueueRows(hub);
  const unreadIds = unreadAdminNotificationIds(hub, readState);
  const scopeCounts = {
    notifications: unreadIds.length,
    payouts: unreadNewPayoutIds(hub, readState).length,
    campaigns: unreadCompletedCampaignIds(campaignSummaries, readState).length,
  };

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Loading notifications…
        </div>
      }
    >
      <AdminNotificationsDashboard
        rows={rows}
        unreadIds={unreadIds}
        scopeCounts={scopeCounts}
        demoLoopEnabled={isAdminDemoNotificationLoopEnabled()}
      />
    </Suspense>
  );
}
