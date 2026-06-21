"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AdminDataTable,
  AdminSectionPanel,
  AdminStatusPill,
  AdminTableHead,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
  MetricCard,
  PageIntro,
  ReviewReasonList,
} from "@/components/admin/shared/AdminUi";
import { RequirementStatusGroup } from "@/components/admin/shared/RequirementStatusBadges";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { isFlaggedPanelist } from "@/lib/admin-panelists";
import type { UnderReviewRow } from "@/lib/admin-dashboard-metrics";
import {
  ADMIN_DASHBOARD_LINKS,
  filterUnderReviewRowsByQueue,
  filterUnderReviewRowsByRequirement,
  parseUnderReviewQueueFilter,
  parseUnderReviewRequirementFilter,
  UNDER_REVIEW_FILTER_LABELS,
  UNDER_REVIEW_QUEUE_LABELS,
} from "@/lib/admin-dashboard-links";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminUnderReviewDashboard({ rows }: { rows: UnderReviewRow[] }) {
  const searchParams = useSearchParams();
  const requirementFilter = parseUnderReviewRequirementFilter(searchParams.get("requirement") ?? undefined);
  const queueFilter = parseUnderReviewQueueFilter(searchParams.get("queue") ?? undefined);
  const [search, setSearch] = useState("");

  const requirementFiltered = useMemo(
    () => filterUnderReviewRowsByRequirement(rows, requirementFilter),
    [rows, requirementFilter]
  );

  const queueFiltered = useMemo(
    () => filterUnderReviewRowsByQueue(requirementFiltered, queueFilter),
    [requirementFiltered, queueFilter]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return queueFiltered;
    return queueFiltered.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.verificationStatus.toLowerCase().includes(query) ||
        row.reasons.some((reason) => reason.toLowerCase().includes(query))
    );
  }, [queueFiltered, search]);

  const pagination = useTablePagination(filtered);

  const incompleteRequirements = rows.filter(
    (row) =>
      row.emailRequirement !== "approved" ||
      row.phoneRequirement !== "approved" ||
      row.photoIdRequirement !== "approved"
  ).length;
  const flagged = rows.filter((row) => isFlaggedPanelist({ verification_status: row.verificationStatus })).length;
  const onHold = rows.filter((row) => row.accountStatus === "on_hold").length;

  const queueHref = (queue: string | null) => {
    const params = new URLSearchParams();
    if (requirementFilter) params.set("requirement", requirementFilter);
    if (queue) params.set("queue", queue);
    const query = params.toString();
    return `/admin/under-review${query ? `?${query}` : ""}#under-review-queue`;
  };

  return (
    <div className="mx-auto min-w-0 max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Panel review"
        title="Under review"
        description={
          queueFilter
            ? `Showing ${UNDER_REVIEW_QUEUE_LABELS[queueFilter].toLowerCase()}.`
            : requirementFilter
              ? `Showing panelists with ${UNDER_REVIEW_FILTER_LABELS[requirementFilter].toLowerCase()} needing review.`
              : "Panelists with incomplete email, phone, or photo ID requirements, plus possible-duplicate flags, pending verification, or on-hold accounts."
        }
      />

      {queueFilter ? (
        <BrandedAlert tone="info" compact showIcon>
          Filtered by {UNDER_REVIEW_QUEUE_LABELS[queueFilter]}.{" "}
          <Link href={queueHref(null)} className="font-semibold underline">
            Show all in queue
          </Link>
        </BrandedAlert>
      ) : null}

      {requirementFilter ? (
        <BrandedAlert tone="info" compact showIcon>
          Filtered by {UNDER_REVIEW_FILTER_LABELS[requirementFilter]}.{" "}
          <Link href="/admin/under-review" className="font-semibold underline">
            Show all under review
          </Link>
        </BrandedAlert>
      ) : null}

      {requirementFilter === "phone" ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Pending phone number <em>changes</em> awaiting approval are in{" "}
          <Link href="/admin/notifications?type=phone" className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100">
            Notifications → Phone changes
          </Link>
          .
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total in queue"
          value={rows.length}
          href="/admin/under-review#under-review-queue"
          active={!queueFilter && !requirementFilter}
        />
        <MetricCard
          label="Requirements incomplete"
          value={incompleteRequirements}
          hint="Email, phone, or ID"
          href={queueHref("incomplete")}
          active={queueFilter === "incomplete"}
        />
        <MetricCard
          label="Flagged"
          value={flagged}
          hint="Possible duplicate"
          href={ADMIN_DASHBOARD_LINKS.panelistsFlagged}
          active={false}
        />
        <MetricCard
          label="Accounts on hold"
          value={onHold}
          href={queueHref("on_hold")}
          active={queueFilter === "on_hold"}
        />
      </div>

      <section
        id="under-review-queue"
        className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Review queue")}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{filtered.length} records</p>
          </div>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, status…"
            className="w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
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
              <Link href="/admin/under-review#under-review-queue" className="font-semibold underline">
                Clear filter
              </Link>
            </BrandedAlert>
          </div>
        ) : (
          <>
            <div className="admin-table-scroll mt-4 max-md:overflow-visible rounded-xl border border-zinc-100 dark:border-zinc-800">
              <AdminDataTable desktopMinWidthClass="md:min-w-[960px]">
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
                    <AdminTableRow key={row.email} className="hover:bg-teal-50/30 dark:hover:bg-teal-950/30">
                      <AdminTableTd label="Name">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{row.name}</span>
                      </AdminTableTd>
                      <AdminTableTd label="Email" className="break-all">
                        {row.email}
                      </AdminTableTd>
                      <AdminTableTd label="Email · Phone · ID">
                        <RequirementStatusGroup
                          email={row.emailRequirement}
                          phone={row.phoneRequirement}
                          photoId={row.photoIdRequirement}
                          iconsOnly
                        />
                      </AdminTableTd>
                      <AdminTableTd label="Verification">
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
                      </AdminTableTd>
                      <AdminTableTd label="Account">
                        {row.accountStatus === "on_hold" ? (
                          <AdminStatusPill label="On hold" tone="warning" />
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">Active</span>
                        )}
                      </AdminTableTd>
                      <AdminTableTd label="Reason">
                        <ReviewReasonList reasons={row.reasons} />
                      </AdminTableTd>
                      <AdminTableTd label="Registered">
                        <span className="tabular-nums">{row.registrationDate || "—"}</span>
                      </AdminTableTd>
                      <AdminTableTd label="Actions">
                        <Link
                          href={`/admin/panelists?email=${encodeURIComponent(row.email)}`}
                          className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
                        >
                          Open record
                        </Link>
                      </AdminTableTd>
                    </AdminTableRow>
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
