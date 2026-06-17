import { Suspense } from "react";
import { AdminUnderReviewDashboard } from "@/components/admin/queues/AdminUnderReviewDashboard";
import { buildUnderReviewRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { loadPanelistPhotoUploadUsernames } from "@/lib/panelist-requirement-context";

export const metadata = {
  title: "Under Review | Admin",
};

export default async function AdminUnderReviewPage() {
  const [hub, photoUploadUsernames] = await Promise.all([loadAdminDataHub(), loadPanelistPhotoUploadUsernames()]);

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
          Loading review queue…
        </div>
      }
    >
      <AdminUnderReviewDashboard rows={buildUnderReviewRows(hub, photoUploadUsernames)} />
    </Suspense>
  );
}
