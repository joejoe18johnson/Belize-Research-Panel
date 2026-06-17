import { AdminPayoutsDashboard } from "@/components/admin/queues/AdminPayoutsDashboard";
import { buildPayoutQueueRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";

export const metadata = {
  title: "Payouts | Admin",
};

export default async function AdminPayoutsPage() {
  const hub = await loadAdminDataHub();
  return <AdminPayoutsDashboard rows={buildPayoutQueueRows(hub)} />;
}
