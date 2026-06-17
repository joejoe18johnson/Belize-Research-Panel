import { Suspense } from "react";
import { AdminNotificationsDashboard } from "@/components/admin/queues/AdminNotificationsDashboard";
import { buildNotificationQueueRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";

export const metadata = {
  title: "Notifications | Admin",
};

export default async function AdminNotificationsPage() {
  const hub = await loadAdminDataHub();

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
          Loading notifications…
        </div>
      }
    >
      <AdminNotificationsDashboard rows={buildNotificationQueueRows(hub)} />
    </Suspense>
  );
}
