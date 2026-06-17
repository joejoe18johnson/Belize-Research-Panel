import { Suspense } from "react";
import { AdminNotificationsDashboard } from "@/components/admin/queues/AdminNotificationsDashboard";
import { buildNotificationQueueRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { unreadAdminNotificationIds } from "@/lib/admin-nav-badges";
import { loadAdminReadState } from "@/lib/admin-read-state";

export const metadata = {
  title: "Notifications | Admin",
};

export default async function AdminNotificationsPage() {
  const hub = await loadAdminDataHub();
  const readState = await loadAdminReadState();
  const rows = buildNotificationQueueRows(hub);
  const unreadIds = unreadAdminNotificationIds(hub, readState);

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
          Loading notifications…
        </div>
      }
    >
      <AdminNotificationsDashboard rows={rows} unreadIds={unreadIds} />
    </Suspense>
  );
}
