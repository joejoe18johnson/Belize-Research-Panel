"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import {
  SurveyBrandingFields,
  uploadSurveyBranding,
  type SurveyBrandingUploadState,
} from "@/components/admin/surveys/SurveyBrandingFields";
import { SurveyOptionListEditor } from "@/components/admin/surveys/SurveyOptionListEditor";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { BUILDER_QUESTION_TYPES, SurveyQuestionField } from "@/components/surveys/SurveyQuestionField";
import {
  createEmptyQuestion,
  sanitizeQuestionOptions,
  SURVEY_QUESTION_TYPE_LABELS,
  type SurveyDefinition,
  type SurveyQuestion,
  type SurveyQuestionType,
} from "@/lib/survey-types";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { formatHeadingCase } from "@/lib/sentence-case";

const CATEGORIES: SurveyCategory[] = ["political", "market", "civic"];

export function SurveyBuilderClient({ initialSurvey }: { initialSurvey?: SurveyDefinition }) {
  const router = useRouter();
  const isEdit = Boolean(initialSurvey);

  const [title, setTitle] = useState(initialSurvey?.title ?? "");
  const [description, setDescription] = useState(initialSurvey?.description ?? "");
  const [companyIntro, setCompanyIntro] = useState(initialSurvey?.companyIntro ?? "");
  const [category, setCategory] = useState<SurveyCategory>(initialSurvey?.category ?? "civic");
  const [status, setStatus] = useState<SurveyDefinition["status"]>(initialSurvey?.status ?? "draft");
  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    initialSurvey?.questions?.length ? initialSurvey.questions : [createEmptyQuestion()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const brandingUploadRef = useRef<SurveyBrandingUploadState>({
    logoFile: null,
    coverFile: null,
    removeLogo: false,
    removeCover: false,
  });

  const handleBrandingChange = useCallback((state: SurveyBrandingUploadState) => {
    brandingUploadRef.current = state;
  }, []);

  const updateQuestion = (id: string, patch: Partial<SurveyQuestion>) => {
    setQuestions((current) => current.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  };

  const insertQuestion = (afterIndex: number, type: SurveyQuestionType = "short_text") => {
    setQuestions((current) => {
      const next = [...current];
      next.splice(afterIndex + 1, 0, createEmptyQuestion(type));
      return next;
    });
  };

  const duplicateQuestion = (id: string) => {
    setQuestions((current) => {
      const index = current.findIndex((question) => question.id === id);
      if (index < 0) return current;
      const copy = {
        ...current[index],
        id: createEmptyQuestion(current[index].type).id,
        title: current[index].title ? `${current[index].title} (copy)` : "",
      };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const moveQuestion = (id: string, direction: -1 | 1) => {
    setQuestions((current) => {
      const index = current.findIndex((question) => question.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions((current) => (current.length <= 1 ? current : current.filter((question) => question.id !== id)));
  };

  const saveSurvey = async (nextStatus: SurveyDefinition["status"]) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        title,
        description,
        companyIntro,
        category,
        status: nextStatus,
        questions: questions.map(sanitizeQuestionOptions),
      };
      const url = isEdit
        ? `/api/admin/survey-definitions/${encodeURIComponent(initialSurvey!.id)}`
        : "/api/admin/survey-definitions";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; survey?: SurveyDefinition };
      if (!res.ok || !data.ok || !data.survey) {
        setError(data.message ?? "Could not save survey.");
        return;
      }

      const brandingResult = await uploadSurveyBranding(data.survey.id, brandingUploadRef.current);
      if (!brandingResult.ok) {
        setError(brandingResult.message ?? "Survey saved, but branding assets could not be uploaded.");
        return;
      }

      setStatus(data.survey.status);
      setMessage(nextStatus === "published" ? "Survey published." : "Survey saved.");
      if (!isEdit) {
        router.push(`/admin/surveys/${encodeURIComponent(data.survey.id)}/edit`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro
        eyebrow="Survey builder"
        title={isEdit ? "Edit survey" : "Create survey"}
        description="Build interview and questionnaire items on-site — similar to Google Forms or Qualtrics. Publish when ready, then launch via Campaigns."
      />

      {error ? (
        <BrandedAlert tone="error" showIcon>
          {error}
        </BrandedAlert>
      ) : null}
      {message ? (
        <BrandedAlert tone="success" showIcon>
          {message}
        </BrandedAlert>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-teal-950">{formatHeadingCase("Survey details")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Belize coastal tourism attitudes"
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as SurveyCategory)}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {formatHeadingCase(item)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</label>
            <p className="mt-2 text-sm font-medium text-zinc-700">{formatHeadingCase(status)}</p>
          </div>
        </div>
      </section>

      <SurveyBrandingFields
        surveyId={initialSurvey?.id}
        initialSurvey={initialSurvey}
        title={title}
        description={description}
        category={category}
        companyIntro={companyIntro}
        onCompanyIntroChange={setCompanyIntro}
        onBrandingChange={handleBrandingChange}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-teal-950">{formatHeadingCase("Questions")}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Use <strong>Add question</strong> below any item to insert the next question in place — no need to scroll back up.
          </p>
        </div>

        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm font-semibold text-teal-900">Question {index + 1}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => moveQuestion(question.id, -1)} className="text-xs font-semibold text-zinc-500 hover:text-teal-800">
                  Move up
                </button>
                <button type="button" onClick={() => moveQuestion(question.id, 1)} className="text-xs font-semibold text-zinc-500 hover:text-teal-800">
                  Move down
                </button>
                <button type="button" onClick={() => duplicateQuestion(question.id)} className="text-xs font-semibold text-zinc-500 hover:text-teal-800">
                  Duplicate
                </button>
                <button type="button" onClick={() => removeQuestion(question.id)} className="text-xs font-semibold text-red-600 hover:text-red-800">
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Question type</label>
                <select
                  value={question.type}
                  onChange={(event) => {
                    const type = event.target.value as SurveyQuestionType;
                    const blank = createEmptyQuestion(type);
                    updateQuestion(question.id, {
                      type,
                      options: blank.options,
                      scaleMin: blank.scaleMin,
                      scaleMax: blank.scaleMax,
                      scaleMinLabel: blank.scaleMinLabel,
                      scaleMaxLabel: blank.scaleMaxLabel,
                    });
                  }}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  {BUILDER_QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {SURVEY_QUESTION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Question</label>
                <input
                  value={question.title}
                  onChange={(event) => updateQuestion(question.id, { title: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Help text (optional)</label>
                <input
                  value={question.description}
                  onChange={(event) => updateQuestion(question.id, { description: event.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(event) => updateQuestion(question.id, { required: event.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-teal-700"
                />
                Required
              </label>

              {question.type === "single_choice" ||
              question.type === "multiple_choice" ||
              question.type === "dropdown" ? (
                <SurveyOptionListEditor
                  options={question.options}
                  multipleAnswers={question.type === "multiple_choice"}
                  onChange={(options) => updateQuestion(question.id, { options })}
                />
              ) : null}

              {question.type === "rating_scale" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scale min</label>
                    <input
                      type="number"
                      value={question.scaleMin}
                      onChange={(event) => updateQuestion(question.id, { scaleMin: Number(event.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Scale max</label>
                    <input
                      type="number"
                      value={question.scaleMax}
                      onChange={(event) => updateQuestion(question.id, { scaleMax: Number(event.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Low label</label>
                    <input
                      value={question.scaleMinLabel}
                      onChange={(event) => updateQuestion(question.id, { scaleMinLabel: event.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">High label</label>
                    <input
                      value={question.scaleMaxLabel}
                      onChange={(event) => updateQuestion(question.id, { scaleMaxLabel: event.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
                <div className="mt-2">
                  <SurveyQuestionField
                    question={sanitizeQuestionOptions(question)}
                    value={undefined}
                    onChange={() => undefined}
                    disabled
                  />
                </div>
              </div>
            </div>
            </article>
            <AddQuestionBelow onAdd={(type) => insertQuestion(index, type)} />
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => saveSurvey("draft")}
          className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-5 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => saveSurvey("published")}
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? "Publishing…" : "Publish survey"}
        </button>
        <Link
          href="/admin/surveys"
          className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Back to library
        </Link>
      </div>
    </div>
  );
}

function AddQuestionBelow({ onAdd }: { onAdd: (type: SurveyQuestionType) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-teal-300 bg-teal-50/50 px-5 text-sm font-semibold text-teal-800 transition hover:border-teal-400 hover:bg-teal-50"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-base leading-none text-white">
            +
          </span>
          Add question
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-4">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-teal-800">
        Choose question type
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {BUILDER_QUESTION_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              onAdd(type);
              setOpen(false);
            }}
            className="rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100"
          >
            {SURVEY_QUESTION_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
