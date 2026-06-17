import { AdminFraudPreventionDashboard } from "@/components/admin/fraud/AdminFraudPreventionDashboard";
import { buildFraudPreventionDetail } from "@/lib/admin-fraud";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Fraud Prevention | Admin | Belize Research Panel",
};

export default async function AdminFraudPreventionPage() {
  const rows = await loadPanelists();
  const detail = buildFraudPreventionDetail(rows);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
        No panelists available yet. Fraud metrics will populate once registrations are recorded.
      </div>
    );
  }

  return <AdminFraudPreventionDashboard detail={detail} />;
}
