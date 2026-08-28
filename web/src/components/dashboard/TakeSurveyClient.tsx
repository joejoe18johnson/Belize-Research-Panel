"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SurveyBrandingHeader } from "@/components/surveys/SurveyBrandingHeader";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { SurveyQuestionField } from "@/components/surveys/SurveyQuestionField";
import {
  calculateSurveyProgress,
  collectSurveyValidationIssues,
  type SurveyAnswerValue,
  type SurveyDefinition,
  type SurveyQuestion,
  type SurveyValidationIssue,
} from "@/lib/survey-types";
import type { PanelistSurveyRecord } from "@/lib/panelist-surveys-types";
import { formatHeadingCase } from "@/lib/sentence-case";
import { campaignCoverAssetUrl, campaignHasCover } from "@/lib/campaign-branding-shared";
import {
  clearSurveyDraft,
  loadSurveyDraft,
  resolveSurveyDraftAnswers,
  saveSurveyDraft,
  surveyAnswersEqual,
} from "@/lib/survey-draft-storage";

function questionElementId(questionId: string): string {
  return `survey-question-${questionId}`;
}

function scrollToQuestion(questionId: string) {
  const target = document.getElementById(questionElementId(questionId));
  target?.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    const field = document.getElementById(`survey-field-${questionId}`);
    if (field instanceof HTMLElement) field.focus({ preventScroll: true });
  }, 280);
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function TakeSurveyClient({
  assignment,
  definition,
  accountEmail,
  initialAnswers,
  serverUpdatedAt,
  submitted,
}: {
  assignment: PanelistSurveyRecord;
  definition: SurveyDefinition;
  accountEmail: string;
  initialAnswers: Record<string, SurveyAnswerValue>;
  serverUpdatedAt?: string | null;
  submitted: boolean;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, SurveyAnswerValue>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<SurveyValidationIssue[]>([]);
  const [done, setDone] = useState(submitted || assignment.status === "completed");
  const [syncNote, setSyncNote] = useState("");
  const [restoredNotice, setRestoredNotice] = useState("");

  const answersRef = useRef(answers);
  const doneRef = useRef(done);
  const serverUpdatedAtRef = useRef(serverUpdatedAt ?? "");
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const lastSyncedRef = useRef<Record<string, SurveyAnswerValue>>(initialAnswers);
  const autosaveTimerRef = useRef<number | null>(null);

  answersRef.current = answers;
  doneRef.current = done;

  const writeLocalDraft = (nextAnswers: Record<string, SurveyAnswerValue>) => {
    if (doneRef.current) return;
    saveSurveyDraft({
      accountEmail,
      assignmentId: assignment.id,
      answers: nextAnswers,
      serverUpdatedAt: serverUpdatedAtRef.current || undefined,
    });
  };

  const persistToServer = async (
    submit: boolean,
    snapshot: Record<string, SurveyAnswerValue>,
    options: { keepalive?: boolean; silent?: boolean } = {}
  ) => {
    const res = await fetch(`/api/dashboard/surveys/${encodeURIComponent(assignment.id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: options.keepalive === true,
      body: JSON.stringify({ answers: snapshot, submit }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      message?: string;
      points?: number;
      updatedAt?: string;
      issues?: SurveyValidationIssue[];
      missingQuestionIds?: string[];
      rewards?: { availablePoints: number; totalPointsToDate: number; surveyPoints: number };
    };
    return { res, data };
  };

  const flushAutosave = async () => {
    if (doneRef.current || inFlightRef.current || submitting) return;
    const snapshot = answersRef.current;
    if (surveyAnswersEqual(snapshot, lastSyncedRef.current)) {
      return;
    }
    if (isOffline()) {
      writeLocalDraft(snapshot);
      setSyncNote("Saved on this device. We'll upload when you're back online.");
      return;
    }

    inFlightRef.current = true;
    setSyncNote("Saving…");
    try {
      const { res, data } = await persistToServer(false, snapshot, { silent: true });
      if (!res.ok || !data.ok) {
        writeLocalDraft(snapshot);
        setSyncNote("Saved on this device. We'll retry uploading.");
        return;
      }
      lastSyncedRef.current = snapshot;
      if (data.updatedAt) serverUpdatedAtRef.current = data.updatedAt;
      writeLocalDraft(snapshot);
      setSyncNote("Progress saved.");
    } catch {
      writeLocalDraft(snapshot);
      setSyncNote("Saved on this device. We'll upload when you're back online.");
    } finally {
      inFlightRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        void flushAutosave();
      }
    }
  };

  const scheduleAutosave = () => {
    if (doneRef.current) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      if (inFlightRef.current) {
        queuedRef.current = true;
        return;
      }
      void flushAutosave();
    }, 1200);
  };

  useLayoutEffect(() => {
    if (done) {
      clearSurveyDraft(accountEmail, assignment.id);
      return;
    }
    const draft = loadSurveyDraft(accountEmail, assignment.id);
    const resolved = resolveSurveyDraftAnswers({
      serverAnswers: initialAnswers,
      serverUpdatedAt,
      draft,
    });
    answersRef.current = resolved.answers;
    lastSyncedRef.current = initialAnswers;
    if (resolved.restoredFromDraft) {
      setAnswers(resolved.answers);
      writeLocalDraft(resolved.answers);
      setRestoredNotice("Your answers were restored after the page refreshed.");
      scheduleAutosave();
    } else if (draft && !surveyAnswersEqual(draft.answers, initialAnswers)) {
      writeLocalDraft(initialAnswers);
    }
    // Restore once on mount for this assignment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.id, accountEmail]);

  useEffect(() => {
    const onOnline = () => {
      setSyncNote("Back online. Saving your progress…");
      void flushAutosave();
    };
    const onOffline = () => {
      writeLocalDraft(answersRef.current);
      setSyncNote("You're offline. Answers are still saved on this device.");
    };
    const persistBeforeLeave = () => {
      if (doneRef.current) return;
      const snapshot = answersRef.current;
      writeLocalDraft(snapshot);
      if (isOffline()) return;
      if (surveyAnswersEqual(snapshot, lastSyncedRef.current)) return;
      try {
        void fetch(`/api/dashboard/surveys/${encodeURIComponent(assignment.id)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          keepalive: true,
          body: JSON.stringify({ answers: snapshot, submit: false }),
        });
      } catch {
        writeLocalDraft(snapshot);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persistBeforeLeave();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("pagehide", persistBeforeLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("pagehide", persistBeforeLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountEmail, assignment.id]);

  const progressPercent = useMemo(
    () => calculateSurveyProgress(definition.questions, answers),
    [definition.questions, answers]
  );
  const requiredRemaining = useMemo(
    () => collectSurveyValidationIssues(definition.questions, answers).length,
    [definition.questions, answers]
  );
  const issueByQuestionId = useMemo(
    () => new Map(issues.map((issue) => [issue.questionId, issue])),
    [issues]
  );

  const updateAnswer = (questionId: string, value: SurveyAnswerValue) => {
    setAnswers((current) => {
      const next = { ...current, [questionId]: value };
      answersRef.current = next;
      writeLocalDraft(next);
      return next;
    });
    setIssues((current) => current.filter((issue) => issue.questionId !== questionId));
    setRestoredNotice("");
    scheduleAutosave();
  };

  const showQuestionIssues = (nextIssues: SurveyValidationIssue[]) => {
    setIssues(nextIssues);
    const summary =
      nextIssues.length === 1
        ? nextIssues[0].message
        : `Please answer ${nextIssues.length} required questions. They are highlighted below.`;
    setError(summary);
    if (nextIssues[0]) {
      requestAnimationFrame(() => scrollToQuestion(nextIssues[0].questionId));
    }
  };

  const persist = async (submit: boolean) => {
    const snapshot = answersRef.current;
    writeLocalDraft(snapshot);

    if (submit) {
      const nextIssues = collectSurveyValidationIssues(definition.questions, snapshot);
      if (nextIssues.length > 0) {
        showQuestionIssues(nextIssues);
        return;
      }
    }

    if (!submit && isOffline()) {
      setError("");
      setMessage("Saved on this device. We'll upload when you're back online.");
      setSyncNote("Saved on this device. We'll upload when you're back online.");
      return;
    }

    if (submit) setSubmitting(true);
    else setSaving(true);
    setError("");
    setMessage("");
    setIssues([]);

    try {
      const { res, data } = await persistToServer(submit, snapshot);
      if (!res.ok || !data.ok) {
        if (data.issues?.length) {
          showQuestionIssues(data.issues);
          return;
        }
        if (data.missingQuestionIds?.length) {
          showQuestionIssues(
            collectSurveyValidationIssues(definition.questions, snapshot).filter((issue) =>
              data.missingQuestionIds?.includes(issue.questionId)
            )
          );
          return;
        }
        setError(data.message ?? "Could not save your responses.");
        return;
      }

      if (submit) {
        clearSurveyDraft(accountEmail, assignment.id);
        setDone(true);
        const earned = data.points ?? assignment.points;
        const params = new URLSearchParams({
          tab: "completed",
          submitted: "1",
          points: String(earned),
        });
        if (assignment.title) params.set("title", assignment.title);
        router.push(`/dashboard/surveys?${params.toString()}`);
        return;
      }

      lastSyncedRef.current = snapshot;
      if (data.updatedAt) serverUpdatedAtRef.current = data.updatedAt;
      writeLocalDraft(snapshot);
      setMessage("Progress saved.");
      setSyncNote("Progress saved.");
    } catch {
      writeLocalDraft(snapshot);
      if (submit) {
        setError("Network error while submitting. Your answers are saved on this device — try again when you're online.");
      } else {
        setMessage("Saved on this device. We'll upload when you're back online.");
        setSyncNote("Saved on this device. We'll upload when you're back online.");
      }
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard/surveys" className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100">
        ← Back to surveys
      </Link>

      <SurveyBrandingHeader
        title={definition.title}
        description={definition.description}
        companyIntro={definition.companyIntro}
        category={definition.category}
        surveyId={definition.id}
        definition={definition}
        coverPreviewUrl={campaignHasCover(assignment) ? campaignCoverAssetUrl(assignment.id) : null}
      />

      <div className="rounded-xl border border-teal-100 dark:border-teal-900/60 bg-teal-50/50 px-4 py-3 text-sm text-teal-900 dark:text-teal-100">
        <strong>+{assignment.points} points</strong> · Complete by {assignment.completeByDate}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <span>{formatHeadingCase("Progress")}</span>
          <span className="shrink-0">{done ? 100 : progressPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${done ? 100 : Math.max(progressPercent, 4)}%` }}
          />
        </div>
        {!done ? (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {requiredRemaining > 0
              ? `${requiredRemaining} required question${requiredRemaining === 1 ? "" : "s"} still need${
                  requiredRemaining === 1 ? "s" : ""
                } an answer before you can submit.`
              : "All required questions are answered. You can submit when you're ready."}{" "}
            Answers are saved on this device as you go, even if you refresh or lose internet.
          </p>
        ) : null}
        {!done && syncNote ? (
          <p className="mt-1 text-xs font-medium text-teal-800 dark:text-teal-200">{syncNote}</p>
        ) : null}
      </div>

      {restoredNotice ? (
        <BrandedAlert tone="info" title="Answers restored" showIcon>
          {restoredNotice}
        </BrandedAlert>
      ) : null}

      {error ? (
        <BrandedAlert tone="error" title="Please complete the highlighted questions" showIcon>
          <p>{error}</p>
          {issues.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {issues.map((issue) => (
                <li key={issue.questionId}>
                  <button
                    type="button"
                    onClick={() => scrollToQuestion(issue.questionId)}
                    className="text-left font-semibold underline underline-offset-2"
                  >
                    Jump to question {issue.questionNumber}: {issue.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </BrandedAlert>
      ) : null}
      {message ? (
        <BrandedAlert tone="success" showIcon>
          {message}
        </BrandedAlert>
      ) : null}

      <div className="space-y-4">
        {definition.questions.map((question: SurveyQuestion, index: number) => {
          const issue = issueByQuestionId.get(question.id);
          const invalid = Boolean(issue);
          return (
            <section
              key={question.id}
              id={questionElementId(question.id)}
              className={`scroll-mt-24 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900 ${
                invalid
                  ? "border-red-400 ring-2 ring-red-200 dark:border-red-500 dark:ring-red-900/60"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100" htmlFor={`survey-field-${question.id}`}>
                {index + 1}. {question.title || "Untitled question"}
                {question.required ? <span className="text-red-600"> *</span> : null}
              </label>
              {question.description ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{question.description}</p>
              ) : null}
              {invalid ? (
                <p id={`survey-error-${question.id}`} className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">
                  {issue?.message ?? "This question is required."}
                </p>
              ) : null}
              <SurveyQuestionField
                question={question}
                value={answers[question.id]}
                onChange={(value) => updateAnswer(question.id, value)}
                disabled={done}
                invalid={invalid}
              />
            </section>
          );
        })}
      </div>

      {!done ? (
        <div className="flex flex-wrap gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button
            type="button"
            disabled={saving || submitting}
            onClick={() => persist(false)}
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-5 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-60"
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
