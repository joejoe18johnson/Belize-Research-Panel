import { AdminSampleSelectionDashboard } from "@/components/admin/sample-selection/AdminSampleSelectionDashboard";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Sample Selection | Admin | Belize Research Panel",
};

export default async function AdminSampleSelectionPage() {
  const panelists = await loadPanelists();

  if (panelists.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
        No panelists available yet. Sample selection will populate once registrations are recorded.
      </div>
    );
  }

  return <AdminSampleSelectionDashboard panelists={panelists} />;
}
