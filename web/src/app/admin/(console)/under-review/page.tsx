import { Suspense } from "react";
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
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Loading review queue…
        </div>
      }
    >
      <AdminUnderReviewDashboard
        rows={buildUnderReviewRows(hub, photoUploadUsernames)}
        unreadEmails={unreadPanelistVerificationEmails(hub, readState)}
      />
    </Suspense>
  );
}
