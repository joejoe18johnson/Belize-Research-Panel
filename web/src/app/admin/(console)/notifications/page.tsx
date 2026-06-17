import { AdminNotificationsDashboard } from "@/components/admin/queues/AdminNotificationsDashboard";
import { buildNotificationQueueRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";

export const metadata = {
  title: "Notifications | Admin",
};

export default async function AdminNotificationsPage() {
  const hub = await loadAdminDataHub();
  return <AdminNotificationsDashboard rows={buildNotificationQueueRows(hub)} />;
}
