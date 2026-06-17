"use client";

import { useState } from "react";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import { SiteSelect } from "@/components/shared/SiteSelect";
import {
  SURVEY_TEMPLATE_TOPICS,
  getSurveyTemplatesByTopic,
  type SurveyTemplate,
  type SurveyTemplateTopicId,
} from "@/lib/survey-templates";
import { formatHeadingCase } from "@/lib/sentence-case";

export function SurveyTemplatePicker({
  onSelectTemplate,
  onStartFromScratch,
}: {
  onSelectTemplate: (template: SurveyTemplate) => void;
  onStartFromScratch: () => void;
}) {
  const [activeTopicId, setActiveTopicId] = useState<SurveyTemplateTopicId>("audience_evaluation");
  const templates = getSurveyTemplatesByTopic(activeTopicId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageIntro
        eyebrow="Survey builder"
        title="Create survey"
        description="Start from a ready-made template or build your own from scratch. Templates load into the builder so you can edit every question before publishing."
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex flex-col lg:flex-row">
          <aside className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
            <div className="border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 lg:hidden">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Topic</label>
              <SiteSelect
                value={activeTopicId}
                onChange={(value) => setActiveTopicId(value as SurveyTemplateTopicId)}
                options={SURVEY_TEMPLATE_TOPICS.map((topic) => ({
                  value: topic.id,
                  label: topic.label,
                }))}
                className="mt-1.5"
              />
            </div>
            <nav className="hidden max-h-[32rem] overflow-y-auto p-2 lg:block">
              {SURVEY_TEMPLATE_TOPICS.map((topic) => {
                const active = topic.id === activeTopicId;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setActiveTopicId(topic.id)}
                    className={`mb-0.5 w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-white dark:bg-zinc-900 font-semibold text-teal-900 dark:text-teal-100 shadow-sm ring-1 ring-zinc-200"
                        : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {SURVEY_TEMPLATE_TOPICS.find((topic) => topic.id === activeTopicId)?.label ?? "Templates"}
              </h2>
              <button
                type="button"
                onClick={onStartFromScratch}
                className="inline-flex min-h-9 items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
              >
                Start from scratch
              </button>
            </div>

            {templates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                No templates in this topic yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onSelectTemplate(template)}
                    className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 p-4 text-left transition hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/40 hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 group-hover:text-teal-900 dark:text-teal-100">{template.title}</p>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                      {template.questions.length} {template.questions.length === 1 ? "question" : "questions"}
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{template.description}</p>
                    <p className="mt-3 text-xs font-semibold text-teal-700 opacity-0 transition group-hover:opacity-100">
                      Use template →
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
        Templates are starting points only — you can rename, reorder, add, or remove questions in the builder.
      </p>
    </div>
  );
}

export function SurveyTemplateBanner({
  templateTitle,
  onChangeTemplate,
}: {
  templateTitle: string;
  onChangeTemplate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3">
      <p className="text-sm text-teal-950 dark:text-teal-100">
        Started from template: <span className="font-semibold">{formatHeadingCase(templateTitle)}</span>
      </p>
      <button
        type="button"
        onClick={onChangeTemplate}
        className="text-sm font-semibold text-teal-800 dark:text-teal-200 hover:text-teal-950 dark:text-teal-100"
      >
        Change template
      </button>
    </div>
  );
}
