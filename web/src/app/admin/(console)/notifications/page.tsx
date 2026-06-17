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
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Loading notifications…
        </div>
      }
    >
      <AdminNotificationsDashboard rows={rows} unreadIds={unreadIds} />
    </Suspense>
  );
}
