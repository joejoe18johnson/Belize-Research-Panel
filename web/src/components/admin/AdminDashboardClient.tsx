"use client";

import Link from "next/link";
import type { AdminPanelOverview } from "@/lib/admin-panelists";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminDashboardClient({ overview }: { overview: AdminPanelOverview }) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Operations overview</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 sm:text-3xl">{formatHeadingCase("Admin dashboard")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          High-level panel health metrics. Manage individual records in Panelists.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Panel overview")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total panelists", overview.total],
            ["Verified", overview.verified],
            ["Pending", overview.pending],
            ["Duplicate warnings", overview.duplicateWarnings],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-zinc-600">{label}</p>
              <p className="mt-2 text-3xl font-bold text-teal-950">{value}</p>
            </div>
          ))}
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
