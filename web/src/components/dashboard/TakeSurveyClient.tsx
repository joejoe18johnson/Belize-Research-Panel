"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { SurveyQuestionField } from "@/components/surveys/SurveyQuestionField";
import {
  calculateSurveyProgress,
  type SurveyAnswerValue,
  type SurveyDefinition,
  type SurveyQuestion,
} from "@/lib/survey-types";
import type { PanelistSurveyRecord } from "@/lib/panelist-surveys-types";
import { formatHeadingCase } from "@/lib/sentence-case";

export function TakeSurveyClient({
  assignment,
  definition,
  initialAnswers,
  submitted,
}: {
  assignment: PanelistSurveyRecord;
  definition: SurveyDefinition;
  initialAnswers: Record<string, SurveyAnswerValue>;
  submitted: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(submitted || assignment.status === "completed");

  const progressPercent = useMemo(
    () => calculateSurveyProgress(definition.questions, answers),
    [definition.questions, answers]
  );

  const updateAnswer = (questionId: string, value: SurveyAnswerValue) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const persist = async (submit: boolean) => {
    if (submit) setSubmitting(true);
    else setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/dashboard/surveys/${encodeURIComponent(assignment.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, submit }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; points?: number };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not save your responses.");
        return;
      }

      if (submit) {
        setDone(true);
        setMessage(`Survey submitted. +${data.points ?? assignment.points} points earned.`);
        router.refresh();
        return;
      }

      setMessage("Progress saved.");
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/surveys" className="text-sm font-semibold text-teal-700 hover:text-teal-900">
          ← Back to surveys
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">{definition.title}</h1>
        {definition.description ? (
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{definition.description}</p>
        ) : null}
        <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-sm text-teal-900">
          <strong>+{assignment.points} points</strong> · Complete by {assignment.completeByDate}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-zinc-600">
          <span>{formatHeadingCase("Progress")}</span>
          <span>{done ? 100 : progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${done ? 100 : Math.max(progressPercent, 4)}%` }}
          />
        </div>
      </div>

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

      <div className="space-y-4">
        {definition.questions.map((question: SurveyQuestion, index: number) => (
          <section key={question.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-semibold text-zinc-900">
              {index + 1}. {question.title || "Untitled question"}
              {question.required ? <span className="text-red-600"> *</span> : null}
            </label>
            {question.description ? (
              <p className="mt-1 text-sm text-zinc-500">{question.description}</p>
            ) : null}
            <SurveyQuestionField
              question={question}
              value={answers[question.id]}
              onChange={(value) => updateAnswer(question.id, value)}
              disabled={done}
            />
          </section>
        ))}
      </div>

      {!done ? (
        <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={saving || submitting}
            onClick={() => persist(false)}
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-5 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save progress"}
          </button>
          <button
            type="button"
            disabled={saving || submitting}
            onClick={() => persist(true)}
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit survey"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          {formatHeadingCase("Thank you — your responses have been recorded.")}
        </div>
      )}
    </div>
  );
}
