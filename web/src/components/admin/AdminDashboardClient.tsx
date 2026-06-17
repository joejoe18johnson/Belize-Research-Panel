"use client";

import Link from "next/link";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import type { AdminDashboardMetrics } from "@/lib/admin-dashboard-metrics";
import { formatHeadingCase } from "@/lib/sentence-case";

function MetricLink({
  href,
  label,
  value,
  hint,
  emphasis = false,
}: {
  href: string;
  label: string;
  value: number;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md ${
        emphasis && value > 0 ? "border-teal-300 ring-1 ring-teal-100" : "border-teal-100"
      }`}
    >
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <p className={`mt-2 font-bold tabular-nums text-teal-950 ${value > 99 ? "text-2xl" : "text-3xl"}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </Link>
  );
}

export function AdminDashboardClient({ metrics }: { metrics: AdminDashboardMetrics }) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <PageIntro
        eyebrow="Operations overview"
        title="Admin dashboard"
        description="Live panel health, account holds, and admin action queues. Open a queue below to review individual records."
      />

      <section>
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Action queues")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricLink
            href="/admin/under-review"
            label="Under review"
            value={metrics.underReviewTotal}
            hint="Pending verification, flagged, or on hold"
            emphasis
          />
          <MetricLink
            href="/admin/notifications"
            label="Notifications"
            value={metrics.pendingEmailChanges + metrics.pendingPhoneChanges + metrics.unverifiedAccounts}
            hint="Contact changes and email verification"
            emphasis
          />
          <MetricLink
            href="/admin/payouts"
            label="Payouts"
            value={metrics.pendingPayouts}
            hint={`${metrics.approvedPayouts} approved awaiting fulfillment`}
            emphasis
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Verification status")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Total panelists" value={metrics.total} />
          <MetricCard label="Verified" value={metrics.verified} />
          <MetricCard label="Pending" value={metrics.pending} hint="Awaiting verification" />
          <MetricCard label="Flagged" value={metrics.flagged} hint="Possible duplicate" />
          <MetricCard label="Needs follow-up" value={metrics.needsFollowUp} />
          <MetricCard label="Rejected" value={metrics.rejected} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Accounts & holds")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricCard label="On hold" value={metrics.onHold} hint="Login accounts paused" />
          <MetricCard label="Fraud review hold" value={metrics.fraudReviewHold} hint="Flagged duplicates" />
          <MetricCard label="Contact change hold" value={metrics.contactChangeHold} />
          <MetricCard label="Pending email changes" value={metrics.pendingEmailChanges} />
          <MetricCard label="Pending phone changes" value={metrics.pendingPhoneChanges} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Integrity")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Duplicate warnings" value={metrics.duplicateWarnings} hint="Name + DOB clusters or flagged" />
          <MetricCard label="Unverified signups" value={metrics.unverifiedAccounts} hint="Email not verified yet" />
        </div>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-teal-950">{formatHeadingCase("Quick links")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/panelists"
            className="inline-flex min-h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Open panelists register
          </Link>
          <Link
            href="/admin/under-review"
            className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            Under review queue
          </Link>
          <Link
            href="/admin/fraud-prevention"
            className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            Fraud prevention
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            Advanced analytics
          </Link>
        </div>
      </section>
    </div>
  );
}
