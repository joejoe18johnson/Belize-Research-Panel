"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminTableScroll, PageIntro, adminResponsiveTableClass } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { countPanelistGroupMembers, panelistGroupSummary } from "@/lib/panelist-group-resolve";
import type { PanelistGroup } from "@/lib/panelist-group-types";
import type { PanelistRow } from "@/lib/panelists";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminPanelistGroupsClient({
  groups,
  panelists,
}: {
  groups: PanelistGroup[];
  panelists: PanelistRow[];
}) {
  const router = useRouter();
  const pagination = useTablePagination(groups);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const memberCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const group of groups) {
      counts.set(group.id, countPanelistGroupMembers(panelists, group));
    }
    return counts;
  }, [groups, panelists]);

  const deleteGroup = async (id: string, name: string) => {
    if (!window.confirm(`Delete group "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/panelist-groups/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not delete group.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageIntro
          eyebrow="Panelists"
          title={formatHeadingCase("Groups")}
          description="Create saved panelist audiences for campaigns — static email lists or dynamic filter rules you can reuse when launching surveys."
        />
        <Link
          href="/admin/groups/create"
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Create group
        </Link>
      </div>

      {error ? (
        <BrandedAlert tone="error" showIcon>
          {error}
        </BrandedAlert>
      ) : null}

      {groups.length === 0 ? (
        <BrandedAlert tone="info" title="No groups yet" showIcon>
          Create a group to save a panelist list or filter rules, then pick it when launching a campaign under{" "}
          <strong>Saved panelist group</strong>.
        </BrandedAlert>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <AdminTableScroll>
          <table className={`${adminResponsiveTableClass} w-full text-left text-sm md:min-w-[640px]`}>
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedRows.map((group) => {
                const memberCount = memberCounts.get(group.id) ?? 0;
                return (
                  <tr key={group.id} className="border-b border-zinc-50 hover:bg-teal-50/30 dark:border-zinc-800/80 dark:hover:bg-teal-950/30">
                    <td data-label="Name" className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{group.name}</p>
                      {group.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {group.description}
                        </p>
                      ) : null}
                    </td>
                    <td data-label="Type" className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {group.type === "static" ? "Static list" : "Filter rules"}
                    </td>
                    <td data-label="Members" className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {panelistGroupSummary(group, memberCount)}
                    </td>
                    <td data-label="Updated" className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{group.updatedAt.slice(0, 10)}</td>
                    <td data-label="Actions" className="px-4 py-3">
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/groups/${encodeURIComponent(group.id)}/edit`}
                          className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === group.id}
                          onClick={() => void deleteGroup(group.id, group.name)}
                          className="font-semibold text-red-600 hover:text-red-800 disabled:opacity-60"
                        >
                          {deletingId === group.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </AdminTableScroll>
          <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <TablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalPages={pagination.totalPages}
              totalRows={pagination.totalRows}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      )}
    </div>
  );
}
