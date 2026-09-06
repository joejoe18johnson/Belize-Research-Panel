import { Suspense } from "react";
import { InlinePanelSkeleton } from "@/components/shared/PageSkeletons";
import { AdminUnderReviewDashboard } from "@/components/admin/queues/AdminUnderReviewDashboard";
import { buildUnderReviewRows } from "@/lib/admin-dashboard-metrics";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { unreadPanelistVerificationEmails } from "@/lib/admin-nav-badges";
import { loadAdminReadState } from "@/lib/admin-read-state";
import { loadPanelistPhotoUploadUsernames } from "@/lib/panelist-requirement-context";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Under Review | Admin",
};

export default async function AdminUnderReviewPage() {
  const [hub, photoUploadUsernames, readState] = await Promise.all([
    loadAdminDataHub(),
    loadPanelistPhotoUploadUsernames(),
    loadAdminReadState(),
  ]);

  return (
    <Suspense fallback={<InlinePanelSkeleton rows={5} />}>
      <AdminUnderReviewDashboard
        rows={buildUnderReviewRows(hub, photoUploadUsernames)}
        unreadEmails={unreadPanelistVerificationEmails(hub, readState)}
      />
    </Suspense>
  );
}
