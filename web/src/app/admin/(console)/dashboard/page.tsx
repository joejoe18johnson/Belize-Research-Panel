import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { buildAdminDashboardMetrics } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";

export const metadata = {
  title: "Admin Dashboard | Belize Research Panel",
};

export default async function AdminDashboardPage() {
  const hub = await loadAdminDataHub();
  const metrics = buildAdminDashboardMetrics(hub);

  if (metrics.total === 0 && hub.accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        No panelists registered yet.
      </div>
    );
  }

  return <AdminDashboardClient metrics={metrics} />;
}
