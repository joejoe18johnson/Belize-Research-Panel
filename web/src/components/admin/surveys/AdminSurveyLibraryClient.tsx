"use client";

import Link from "next/link";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { SurveyDefinition } from "@/lib/survey-definitions";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminSurveyLibraryClient({ surveys }: { surveys: SurveyDefinition[] }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageIntro
          eyebrow="Survey builder"
          title="On-site surveys"
          description="Create and manage questionnaires hosted on the Belize Research Panel — no Qualtrics, QuestionPro, or external API keys required."
        />
        <Link
          href="/admin/surveys/create"
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Create survey
        </Link>
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
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Questions</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => (
                <tr key={survey.id} className="border-b border-zinc-50 hover:bg-teal-50/30">
                  <td className="px-4 py-3 font-medium text-zinc-900">{survey.title}</td>
                  <td className="px-4 py-3 capitalize text-zinc-600">{survey.category}</td>
                  <td className="px-4 py-3 text-zinc-600">{survey.questions.length}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        survey.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : survey.status === "closed"
                            ? "bg-zinc-100 text-zinc-700"
                            : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {formatHeadingCase(survey.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{survey.updatedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/surveys/${encodeURIComponent(survey.id)}/edit`}
                      className="font-semibold text-teal-700 hover:text-teal-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
