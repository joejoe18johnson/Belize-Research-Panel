"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { BrandedPdfActions } from "@/components/shared/BrandedPdfActions";
import { payoutShortId, formatPayoutPaymentDetails, payoutStatusLabel } from "@/lib/admin-payout-display";
import type { RedemptionRequest } from "@/lib/reward-redemption";
import { formatBz } from "@/lib/reward-redemption";
import type { ViewLayout } from "@/lib/view-layout";
import { viewLayoutContainerClass, viewLayoutItemClass } from "@/lib/view-layout";
import { ViewLayoutToggle, useViewLayout } from "@/components/shared/ViewLayoutToggle";
import { formatHeadingCase } from "@/lib/sentence-case";
import { BanknotesIcon } from "./DashboardIcons";
import { DashboardCard, SectionHeading } from "./DashboardShell";

function formatPayoutDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-BZ", { day: "numeric", month: "short", year: "numeric" });
}

function statusTone(status: RedemptionRequest["status"]): string {
  switch (status) {
    case "fulfilled":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "approved":
      return "bg-teal-50 text-teal-800 dark:text-teal-200 border-teal-200";
    case "rejected":
      return "bg-red-50 text-red-800 border-red-200";
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

function payoutStatusDetail(request: RedemptionRequest): string {
  switch (request.status) {
    case "pending":
      return "Submitted — waiting for review";
    case "approved":
      return "Being processed by our team";
    case "fulfilled":
      return `Paid on ${formatPayoutDate(request.updatedAt)}`;
    case "rejected":
      return `Not approved on ${formatPayoutDate(request.updatedAt)} — points returned to your balance`;
    default:
      return request.status;
  }
}

function PayoutRequestCard({ request, layout }: { request: RedemptionRequest; layout: ViewLayout }) {
  const amountBz = request.amountBz ?? request.points / 25;
  const payment = formatPayoutPaymentDetails(request.optionId, request.details, { maskSensitive: true });
  const statusLabel = payoutStatusLabel(request.status);

  if (layout === "cards") {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{formatHeadingCase(request.optionLabel)}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{payoutStatusDetail(request)}</p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              Ref {payoutShortId(request.id)} · Submitted {formatPayoutDate(request.submittedAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-sm font-bold tabular-nums text-teal-900 dark:text-teal-100">{formatBz(amountBz)}</span>
            <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{request.points.toLocaleString()} pts</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(request.status)}`}>
              {formatHeadingCase(statusLabel)}
            </span>
          </div>
        </div>
        {payment.fields.length > 0 ? (
          <dl className="mt-4 space-y-1.5 border-t border-zinc-200 dark:border-zinc-800 pt-3 text-xs">
            {payment.fields.map((field) => (
              <div key={field.label} className="flex justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{field.label}</dt>
                <dd className="font-medium text-zinc-800 dark:text-zinc-200">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <BrandedPdfActions
            viewHref={`/api/dashboard/payouts/${encodeURIComponent(request.id)}/statement`}
            compact
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 py-1">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{formatHeadingCase(request.optionLabel)}</p>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(request.status)}`}>
            {formatHeadingCase(statusLabel)}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{payoutStatusDetail(request)}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
          <span>Ref {payoutShortId(request.id)}</span>
          <span>Submitted {formatPayoutDate(request.submittedAt)}</span>
          <span>{payment.title}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums text-teal-900 dark:text-teal-100">{formatBz(amountBz)}</p>
        <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{request.points.toLocaleString()} pts</p>
        <div className="mt-2 flex justify-end">
          <BrandedPdfActions
            viewHref={`/api/dashboard/payouts/${encodeURIComponent(request.id)}/statement`}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function PayoutList({
  requests,
  emptyTitle,
  emptyDescription,
  action,
}: {
  requests: RedemptionRequest[];
  emptyTitle: string;
  emptyDescription: string;
  action?: ReactNode;
}) {
  const [layout, setLayout] = useViewLayout("dashboard-payouts-list");

  return (
    <>
      <div className="flex justify-end">
        <ViewLayoutToggle value={layout} onChange={setLayout} />
      </div>
      {requests.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-8 text-center">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">{formatHeadingCase(emptyTitle)}</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{emptyDescription}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      ) : (
        <div
          className={`mt-4 ${viewLayoutContainerClass(
            layout,
            layout === "list" ? "divide-y divide-zinc-100" : "grid gap-4 sm:grid-cols-2",
          )}`}
        >
          {requests.map((request) => (
            <div
              key={request.id}
              className={`${viewLayoutItemClass(layout)} ${layout === "list" ? "py-4 first:pt-2" : ""}`}
            >
              <PayoutRequestCard request={request} layout={layout} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function DashboardPayoutsSection({ requests }: { requests: RedemptionRequest[] }) {
  const { active, history, pendingCount, processingCount, completedCount } = useMemo(() => {
    const sorted = [...requests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    const activeRequests = sorted.filter((request) => request.status === "pending" || request.status === "approved");
    const historyRequests = sorted.filter((request) => request.status === "fulfilled" || request.status === "rejected");

    return {
      active: activeRequests,
      history: historyRequests,
      pendingCount: sorted.filter((request) => request.status === "pending").length,
      processingCount: sorted.filter((request) => request.status === "approved").length,
      completedCount: sorted.filter((request) => request.status === "fulfilled").length,
    };
  }, [requests]);

  const redeemLink = (
    <Link
      href="/dashboard/rewards/redeem"
      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
    >
      Redeem points
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard className="border-amber-200 bg-gradient-to-br from-amber-50/80 to-white">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Pending review")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-amber-900">{pendingCount}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Waiting for admin approval</p>
        </DashboardCard>
        <DashboardCard className="border-teal-200 bg-gradient-to-br from-teal-50/80 to-white">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("In processing")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-teal-900 dark:text-teal-100">{processingCount}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Approved and being paid out</p>
        </DashboardCard>
        <DashboardCard className="border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Completed payouts")}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-900">{completedCount}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Successfully fulfilled</p>
        </DashboardCard>
      </div>

      <DashboardCard>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <BanknotesIcon className="h-5 w-5" />
            </span>
            <div>
              <SectionHeading as="h3">Active payouts</SectionHeading>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                Open redemption requests that are pending review or being processed.
              </p>
            </div>
          </div>
        </div>
        <PayoutList
          requests={active}
          emptyTitle="No active payouts"
          emptyDescription="When you redeem points, your payout requests will appear here until they are completed."
          action={redeemLink}
        />
      </DashboardCard>

      <DashboardCard>
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <SectionHeading as="h3">Payment history</SectionHeading>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            Completed and declined payouts on your account.
          </p>
        </div>
        <PayoutList
          requests={history}
          emptyTitle="No payment history yet"
          emptyDescription="Fulfilled and declined payout requests will be listed here."
        />
      </DashboardCard>
    </div>
  );
}
