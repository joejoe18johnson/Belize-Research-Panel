"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AdminDataTable,
  AdminDocPill,
  AdminSectionPanel,
  AdminStatusPill,
  AdminTableHead,
  AdminTableTh,
  IconMetricCard,
  PageIntro,
} from "@/components/admin/shared/AdminUi";
import type {
  AdminDashboardMetrics,
  PayoutQueueRow,
  RecentPanelistRow,
} from "@/lib/admin-dashboard-metrics";
import { ADMIN_DASHBOARD_LINKS } from "@/lib/admin-dashboard-links";
import { formatBz } from "@/lib/reward-redemption";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { formatHeadingCase } from "@/lib/sentence-case";

function DashboardIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      {children}
    </svg>
  );
}

function verificationTone(status: string): "success" | "warning" | "neutral" {
  const normalized = status.toLowerCase();
  if (normalized === "verified") return "success";
  if (normalized.includes("pending") || normalized.includes("duplicate")) return "warning";
  return "neutral";
}

export function AdminDashboardClient({
  metrics,
  recentPanelists,
  recentPayouts,
}: {
  metrics: AdminDashboardMetrics;
  recentPanelists: RecentPanelistRow[];
  recentPayouts: PayoutQueueRow[];
}) {
  const panelistsPagination = useTablePagination(recentPanelists);
  const usersPagination = useTablePagination(recentPanelists);
  const payoutsPagination = useTablePagination(recentPayouts);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <PageIntro
        eyebrow="Operations overview"
        title="Admin dashboard"
        description="Overview of all platform data — panel health, verification queues, and payout activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.panelists}
          label="Panelists"
          value={metrics.total}
          tone="blue"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </DashboardIcon>
          }
        />
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.verified}
          label="Verified"
          value={metrics.verified}
          tone="green"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </DashboardIcon>
          }
        />
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.underReview}
          label="Under review"
          value={metrics.underReviewTotal}
          tone="amber"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </DashboardIcon>
          }
        />
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.payouts}
          label="Payouts"
          value={metrics.totalRedemptionRequests}
          tone="rose"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </DashboardIcon>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.underReview}
          label="Under review"
          value={metrics.underReviewTotal}
          tone="amber"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </DashboardIcon>
          }
        />
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.phoneReview}
          label="Phone numbers to review"
          value={metrics.phoneNumbersToReview}
          tone="blue"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </DashboardIcon>
          }
        />
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.addressReview}
          label="Address documents to review"
          value={metrics.addressDocumentsToReview}
          tone="green"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </DashboardIcon>
          }
        />
        <IconMetricCard
          href={ADMIN_DASHBOARD_LINKS.identityReview}
          label="Identity documents to review"
          value={metrics.idDocumentsToReview}
          tone="violet"
          icon={
            <DashboardIcon>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </DashboardIcon>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminSectionPanel title="Recent panelists" viewAllHref={ADMIN_DASHBOARD_LINKS.panelists}>
          <div className="overflow-x-auto">
            <AdminDataTable className="min-w-[640px]">
              <AdminTableHead>
                <AdminTableTh>Name</AdminTableTh>
                <AdminTableTh>Status</AdminTableTh>
                <AdminTableTh>Verification</AdminTableTh>
                <AdminTableTh>Phone</AdminTableTh>
              </AdminTableHead>
              <tbody>
                {recentPanelists.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                      No panelists registered yet.
                    </td>
                  </tr>
                ) : (
                  panelistsPagination.paginatedRows.map((row) => (
                    <tr key={row.email} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                          className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-teal-800 dark:text-teal-200"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={row.panelistStatus === "Active" ? "font-medium text-emerald-600" : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500"}>
                          {row.panelistStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusPill label={row.verificationStatus} tone={verificationTone(row.verificationStatus)} />
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.phone}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdminDataTable>
          </div>
          {recentPanelists.length > 0 ? (
            <div className="px-4 pb-4">
              <TablePagination
                page={panelistsPagination.page}
                pageSize={panelistsPagination.pageSize}
                totalPages={panelistsPagination.totalPages}
                totalRows={panelistsPagination.totalRows}
                onPageChange={panelistsPagination.setPage}
                onPageSizeChange={panelistsPagination.setPageSize}
              />
            </div>
          ) : null}
        </AdminSectionPanel>

        <AdminSectionPanel title="Recent users" viewAllHref={ADMIN_DASHBOARD_LINKS.panelists}>
          <div className="overflow-x-auto">
            <AdminDataTable className="min-w-[720px]">
              <AdminTableHead>
                <AdminTableTh>Name</AdminTableTh>
                <AdminTableTh>Email</AdminTableTh>
                <AdminTableTh>Status</AdminTableTh>
                <AdminTableTh>Phone</AdminTableTh>
                <AdminTableTh>Phone approved</AdminTableTh>
                <AdminTableTh>Docs</AdminTableTh>
              </AdminTableHead>
              <tbody>
                {recentPanelists.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                      No users registered yet.
                    </td>
                  </tr>
                ) : (
                  usersPagination.paginatedRows.map((row) => (
                    <tr key={`user-${row.email}`} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.name}</td>
                      <td className="max-w-[10rem] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.email}</td>
                      <td className="px-4 py-3">
                        <span className={row.panelistStatus === "Active" ? "font-medium text-emerald-600" : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500"}>
                          {row.panelistStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.phone}</td>
                      <td className="px-4 py-3">
                        {row.phoneApproved ? (
                          <span className="font-medium text-emerald-600">Yes</span>
                        ) : (
                          <span className="text-zinc-400 dark:text-zinc-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.hasIdDoc ? (
                            <AdminDocPill
                              href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                              label="ID"
                            />
                          ) : null}
                          {row.hasAddressDoc ? (
                            <AdminDocPill
                              href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                              label="Addr"
                            />
                          ) : null}
                          {!row.hasIdDoc && !row.hasAddressDoc ? <span className="text-zinc-400 dark:text-zinc-500">—</span> : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </AdminDataTable>
          </div>
          {recentPanelists.length > 0 ? (
            <div className="px-4 pb-4">
              <TablePagination
                page={usersPagination.page}
                pageSize={usersPagination.pageSize}
                totalPages={usersPagination.totalPages}
                totalRows={usersPagination.totalRows}
                onPageChange={usersPagination.setPage}
                onPageSizeChange={usersPagination.setPageSize}
              />
            </div>
          ) : null}
        </AdminSectionPanel>
      </div>

      <AdminSectionPanel title="Recent payouts" viewAllHref={ADMIN_DASHBOARD_LINKS.payouts}>
        <div className="overflow-x-auto">
          <AdminDataTable className="min-w-[640px]">
            <AdminTableHead>
              <AdminTableTh>Request ID</AdminTableTh>
              <AdminTableTh>Payment</AdminTableTh>
              <AdminTableTh>Option</AdminTableTh>
              <AdminTableTh align="right">Amount</AdminTableTh>
              <AdminTableTh>Status</AdminTableTh>
            </AdminTableHead>
            <tbody>
              {recentPayouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                    No payout requests yet.
                  </td>
                </tr>
              ) : (
                payoutsPagination.paginatedRows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{row.shortId}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.paymentTitle}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.optionLabel}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{formatBz(row.amountBz)}</td>
                    <td className="px-4 py-3">
                      <AdminStatusPill
                        label={formatHeadingCase(
                          row.status === "fulfilled"
                            ? "Completed"
                            : row.status === "approved"
                              ? "Processing"
                              : row.status
                        )}
                        tone={
                          row.status === "fulfilled"
                            ? "success"
                            : row.status === "approved"
                              ? "info"
                              : "warning"
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </AdminDataTable>
        </div>
        {recentPayouts.length > 0 ? (
          <div className="px-4 pb-4">
            <TablePagination
              page={payoutsPagination.page}
              pageSize={payoutsPagination.pageSize}
              totalPages={payoutsPagination.totalPages}
              totalRows={payoutsPagination.totalRows}
              onPageChange={payoutsPagination.setPage}
              onPageSizeChange={payoutsPagination.setPageSize}
            />
          </div>
        ) : null}
      </AdminSectionPanel>
    </div>
  );
}
