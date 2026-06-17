import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getAdminPanelOverview } from "@/lib/admin-panelists";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Admin Dashboard | Belize Research Panel",
};

export default async function AdminDashboardPage() {
  const rows = await loadPanelists();

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        No panelists registered yet.
      </div>
    );
  }

  return <AdminDashboardClient overview={getAdminPanelOverview(rows)} />;
}
