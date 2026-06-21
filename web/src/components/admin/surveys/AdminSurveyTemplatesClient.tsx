"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminTableScroll, PageIntro, adminResponsiveTableClass } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { SurveyCustomTemplate } from "@/lib/survey-custom-template-types";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

export function AdminSurveyTemplatesClient({ templates }: { templates: SurveyCustomTemplate[] }) {
  const router = useRouter();
  const pagination = useTablePagination(templates);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const deleteTemplate = async (id: string, title: string) => {
    if (!window.confirm(`Delete template "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/survey-templates/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not delete template.");
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
          eyebrow="My templates"
          title="My templates"
          description="Save reusable questionnaire layouts. Use them when creating a new on-site survey — then edit titles and questions before publishing."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/surveys"
            className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            On-site surveys
          </Link>
          <Link
            href="/admin/templates/create"
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Create template
          </Link>
        </div>
      </div>

      {error ? (
        <BrandedAlert tone="error" showIcon>
          {error}
        </BrandedAlert>
      ) : null}

      {templates.length === 0 ? (
        <BrandedAlert tone="info" title="No custom templates yet" showIcon>
          Build a template with your standard questions, then pick it from{" "}
          <Link href="/admin/surveys/create" className="font-semibold underline">
            Create survey
          </Link>{" "}
          under <strong>My custom templates</strong>.
        </BrandedAlert>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <AdminTableScroll>
          <table className={`${adminResponsiveTableClass} w-full text-left text-sm md:min-w-[640px]`}>
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedRows.map((template) => (
                <tr key={template.id} className="border-b border-zinc-50 hover:bg-teal-50/30 dark:border-zinc-800/80 dark:hover:bg-teal-950/30">
                  <td data-label="Title" className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{template.title}</p>
                    {template.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {template.description}
                      </p>
                    ) : null}
                  </td>
                  <td data-label="Category" className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatAdminLabel(template.category)}</td>
                  <td data-label="Questions" className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{template.questions.length}</td>
                  <td data-label="Updated" className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{template.updatedAt.slice(0, 10)}</td>
                  <td data-label="Actions" className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/templates/${encodeURIComponent(template.id)}/edit`}
                        className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === template.id}
                        onClick={() => void deleteTemplate(template.id, template.title)}
                        className="font-semibold text-red-600 hover:text-red-800 disabled:opacity-60"
                      >
                        {deletingId === template.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
