import { AdminAdvancedAnalyticsDashboard } from "@/components/admin/analytics/AdminAdvancedAnalyticsDashboard";
import { panelistToAnalyticsSlice } from "@/lib/admin-analytics";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Advanced Analytics | Admin | Belize Research Panel",
};

export default async function AdminAdvancedAnalyticsPage() {
  const rows = await loadPanelists();
  const slices = rows.map(panelistToAnalyticsSlice);

  if (slices.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
        No panelists available yet. Analytics will populate once registrations are recorded.
      </div>
    );
  }

  return <AdminAdvancedAnalyticsDashboard slices={slices} />;
}
