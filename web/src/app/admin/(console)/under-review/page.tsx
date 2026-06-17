import { AdminUnderReviewDashboard } from "@/components/admin/queues/AdminUnderReviewDashboard";
import { buildUnderReviewRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { loadPanelistPhotoUploadUsernames } from "@/lib/panelist-requirement-context";

export const metadata = {
  title: "Under Review | Admin",
};

export default async function AdminUnderReviewPage() {
  const [hub, photoUploadUsernames] = await Promise.all([loadAdminDataHub(), loadPanelistPhotoUploadUsernames()]);
  return <AdminUnderReviewDashboard rows={buildUnderReviewRows(hub, photoUploadUsernames)} />;
}
