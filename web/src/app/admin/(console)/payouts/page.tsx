import { AdminPayoutsDashboard } from "@/components/admin/queues/AdminPayoutsDashboard";
import { buildPayoutHistoryRows, buildPayoutQueueRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { unreadNewPayoutIds } from "@/lib/admin-nav-badges";
import { loadAdminReadState } from "@/lib/admin-read-state";

export const metadata = {
  title: "Payouts | Admin",
};

export default async function AdminPayoutsPage() {
  const hub = await loadAdminDataHub();
  const readState = await loadAdminReadState();
  const unreadPayoutIds = unreadNewPayoutIds(hub, readState);

  return (
    <AdminPayoutsDashboard
      queueRows={buildPayoutQueueRows(hub)}
      historyRows={buildPayoutHistoryRows(hub)}
      unreadPayoutIds={unreadPayoutIds}
    />
  );
}
