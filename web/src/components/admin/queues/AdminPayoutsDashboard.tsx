"use client";

import { IconMetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { AdminMarkReadButton } from "@/components/admin/shared/AdminMarkReadButton";
import type { PayoutQueueRow } from "@/lib/admin-dashboard-metrics";
import { formatBz } from "@/lib/reward-redemption";
import { AdminPayoutQueueSection } from "./AdminPayoutQueueSection";

export function AdminPayoutsDashboard({
  queueRows,
  historyRows,
  unreadPayoutIds = [],
}: {
  queueRows: PayoutQueueRow[];
  historyRows: PayoutQueueRow[];
  unreadPayoutIds?: string[];
}) {
  const pending = queueRows.filter((row) => row.status === "pending").length;
  const approved = queueRows.filter((row) => row.status === "approved").length;
  const completed = historyRows.filter((row) => row.status === "fulfilled").length;
  const declined = historyRows.filter((row) => row.status === "rejected").length;
  const openAmount = queueRows.reduce((sum, row) => sum + row.amountBz, 0);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Rewards fulfillment"
        title="Payouts"
        description="Review panelist redemption requests, process payouts, and view fulfillment history."
        action={<AdminMarkReadButton scope="payouts" label="Mark new as read" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IconMetricCard label="Open requests" value={pending + approved} tone="amber" icon={<MetricClockIcon />} />
        <IconMetricCard label="Pending review" value={pending} tone="blue" icon={<MetricReviewIcon />} />
        <IconMetricCard
          label="In processing"
          value={approved}
          hint="Started, not yet complete"
          tone="green"
          icon={<MetricCheckIcon />}
        />
        <IconMetricCard
          label="Open liability"
          value={formatBz(openAmount)}
          hint={`${completed} completed · ${declined} declined`}
          tone="violet"
          icon={<MetricCashIcon />}
        />
      </div>

      <AdminPayoutQueueSection
        rows={queueRows}
        title="Payout queue"
        description={`${pending} new request${pending === 1 ? "" : "s"} waiting for review.`}
        defaultStatusFilter="new"
        unreadPayoutIds={unreadPayoutIds}
      />

      <AdminPayoutQueueSection
        sectionId="payout-history"
        rows={historyRows}
        title="Fulfillment history"
        description={`${completed} completed and ${declined} declined payout${completed + declined === 1 ? "" : "s"} for reference.`}
        mode="history"
        defaultStatusFilter="all"
        emptyTitle="No payout history yet"
        emptyMessage="Completed and declined requests will appear here after processing."
      />
    </div>
  );
}

function MetricClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function MetricReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625A1.125 1.125 0 0 0 4.5 3.75v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function MetricCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function MetricCashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}
