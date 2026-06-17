import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import {
  buildAdminDashboardMetrics,
  buildRecentPayoutRows,
  buildRecentPanelistRows,
} from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { loadPanelistPhotoUploadUsernames } from "@/lib/panelist-requirement-context";

export const metadata = {
  title: "Admin Dashboard | Belize Research Panel",
};

export default async function AdminDashboardPage() {
  const hub = await loadAdminDataHub();
  const photoUploadUsernames = await loadPanelistPhotoUploadUsernames();
  const metrics = buildAdminDashboardMetrics(hub);
  const recentPanelists = buildRecentPanelistRows(hub, photoUploadUsernames);
  const recentPayouts = buildRecentPayoutRows(hub);

  if (metrics.total === 0 && hub.accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
        No panelists registered yet.
      </div>
    );
  }

  return (
    <AdminDashboardClient
      metrics={metrics}
      recentPanelists={recentPanelists}
      recentPayouts={recentPayouts}
    />
  );
}
