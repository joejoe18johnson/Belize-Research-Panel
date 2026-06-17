import { AdminUnderReviewDashboard } from "@/components/admin/queues/AdminUnderReviewDashboard";
import { buildUnderReviewRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";

export const metadata = {
  title: "Under Review | Admin",
};

export default async function AdminUnderReviewPage() {
  const hub = await loadAdminDataHub();
  return <AdminUnderReviewDashboard rows={buildUnderReviewRows(hub)} />;
}
