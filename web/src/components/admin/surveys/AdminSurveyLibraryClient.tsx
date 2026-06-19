"use client";

import Link from "next/link";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { SurveyDefinition } from "@/lib/survey-types";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

export function AdminSurveyLibraryClient({ surveys }: { surveys: SurveyDefinition[] }) {
  const pagination = useTablePagination(surveys);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageIntro
          eyebrow="Survey builder"
          title="On-site surveys"
          description="Create and manage questionnaires hosted on the Belize Research Panel — no Qualtrics, QuestionPro, or external API keys required."
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/surveys/create"
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Create survey
          </Link>
        </div>
      </div>

      {surveys.length === 0 ? (
        <BrandedAlert tone="info" title="No surveys yet" showIcon>
          Build your first on-site questionnaire, publish it, then launch it to panelists from{" "}
          <Link href="/admin/campaigns/create" className="font-semibold underline">
            Create campaign
          </Link>
          .
        </BrandedAlert>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Questions</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedRows.map((survey) => (
                <tr key={survey.id} className="border-b border-zinc-50 hover:bg-teal-50/30">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{survey.title}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatAdminLabel(survey.category)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{survey.questions.length}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        survey.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : survey.status === "closed"
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {formatHeadingCase(survey.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{survey.updatedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/surveys/${encodeURIComponent(survey.id)}/edit`}
                      className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
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
