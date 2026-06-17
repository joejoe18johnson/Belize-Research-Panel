"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AdminDataTable,
  AdminSectionPanel,
  AdminStatusPill,
  AdminTableHead,
  AdminTableTh,
  MetricCard,
  PageIntro,
} from "@/components/admin/shared/AdminUi";
import { RequirementStatusGroup } from "@/components/admin/shared/RequirementStatusBadges";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { UnderReviewRow } from "@/lib/admin-dashboard-metrics";
import {
  filterUnderReviewRowsByRequirement,
  parseUnderReviewRequirementFilter,
  UNDER_REVIEW_FILTER_LABELS,
} from "@/lib/admin-dashboard-links";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminUnderReviewDashboard({ rows }: { rows: UnderReviewRow[] }) {
  const searchParams = useSearchParams();
  const requirementFilter = parseUnderReviewRequirementFilter(searchParams.get("requirement") ?? undefined);
  const [search, setSearch] = useState("");

  const requirementFiltered = useMemo(
    () => filterUnderReviewRowsByRequirement(rows, requirementFilter),
    [rows, requirementFilter]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requirementFiltered;
    return requirementFiltered.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.verificationStatus.toLowerCase().includes(query) ||
        row.reason.toLowerCase().includes(query)
    );
  }, [requirementFiltered, search]);

  const pagination = useTablePagination(filtered, 2);

  const incompleteRequirements = rows.filter(
    (row) =>
      row.emailRequirement !== "approved" ||
      row.phoneRequirement !== "approved" ||
      row.photoIdRequirement !== "approved"
  ).length;
  const flagged = rows.filter((row) => row.verificationStatus === "Possible Duplicate").length;
  const onHold = rows.filter((row) => row.accountStatus === "on_hold").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Panel review"
        title="Under review"
        description={
          requirementFilter
            ? `Showing panelists with ${UNDER_REVIEW_FILTER_LABELS[requirementFilter].toLowerCase()} needing review.`
            : "Panelists with incomplete email, phone, or photo ID requirements, plus flagged, pending, or on-hold accounts."
        }
      />

      {requirementFilter ? (
        <BrandedAlert tone="info" compact showIcon>
          Filtered by {UNDER_REVIEW_FILTER_LABELS[requirementFilter]}.{" "}
          <Link href="/admin/under-review" className="font-semibold underline">
            Show all under review
          </Link>
        </BrandedAlert>
      ) : null}

      {requirementFilter === "phone" ? (
        <p className="text-sm text-zinc-600">
          Pending phone number <em>changes</em> awaiting approval are in{" "}
          <Link href="/admin/notifications?type=phone" className="font-semibold text-teal-700 hover:text-teal-900">
            Notifications → Phone changes
          </Link>
          .
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total in queue" value={requirementFiltered.length} />
        <MetricCard label="Requirements incomplete" value={incompleteRequirements} hint="Email, phone, or ID" />
        <MetricCard label="Flagged" value={flagged} />
        <MetricCard label="Accounts on hold" value={onHold} />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Review queue")}</h2>
            <p className="mt-1 text-sm text-zinc-500">{filtered.length} records</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, status…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="success" title="Queue clear" showIcon>
              No panelists currently require review.
            </BrandedAlert>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4">
            <BrandedAlert tone="info" title="No matches" showIcon>
              No records match this filter.{" "}
              <Link href="/admin/under-review" className="font-semibold underline">
                Clear filter
              </Link>
            </BrandedAlert>
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
              <AdminDataTable className="min-w-[960px]">
                <AdminTableHead>
                  <AdminTableTh>Name</AdminTableTh>
                  <AdminTableTh>Email</AdminTableTh>
                  <AdminTableTh>Email · Phone · ID</AdminTableTh>
                  <AdminTableTh>Verification</AdminTableTh>
                  <AdminTableTh>Account</AdminTableTh>
                  <AdminTableTh>Reason</AdminTableTh>
                  <AdminTableTh>Registered</AdminTableTh>
                  <AdminTableTh>Actions</AdminTableTh>
                </AdminTableHead>
                <tbody>
                  {pagination.paginatedRows.map((row) => (
                    <tr key={row.email} className="border-b border-zinc-50 hover:bg-teal-50/30">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-800">{row.name}</td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-zinc-700">{row.email}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <RequirementStatusGroup
                          email={row.emailRequirement}
                          phone={row.phoneRequirement}
                          photoId={row.photoIdRequirement}
                          iconsOnly
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <AdminStatusPill
                          label={row.verificationStatus}
                          tone={
                            row.verificationStatus === "Verified"
                              ? "success"
                              : row.verificationStatus === "Pending"
                                ? "warning"
                                : "neutral"
                          }
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.accountStatus === "on_hold" ? (
                          <AdminStatusPill label="On hold" tone="warning" />
                        ) : (
                          <span className="text-zinc-500">Active</span>
                        )}
                      </td>
                      <td className="max-w-[14rem] px-4 py-3 text-zinc-600">{row.reason}</td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-600">
                        {row.registrationDate || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                          className="font-semibold text-teal-700 hover:text-teal-900"
                        >
                          Open record
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminDataTable>
            </div>
            <TablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalPages={pagination.totalPages}
              totalRows={pagination.totalRows}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </section>
    </div>
  );
}
