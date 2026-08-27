import type { SurveyAnswerValue } from "./survey-types";

const DRAFT_VERSION = 1;

export interface SurveyDraft {
  version: number;
  assignmentId: string;
  accountEmail: string;
  answers: Record<string, SurveyAnswerValue>;
  savedAt: string;
  serverUpdatedAt?: string;
}

function draftKey(accountEmail: string, assignmentId: string): string {
  return `brp-survey-draft:${accountEmail.trim().toLowerCase()}:${assignmentId.trim()}`;
}

function parseDraft(raw: string, accountEmail: string, assignmentId: string): SurveyDraft | null {
  try {
    const parsed = JSON.parse(raw) as SurveyDraft;
    if (parsed.version !== DRAFT_VERSION) return null;
    if (parsed.accountEmail.trim().toLowerCase() !== accountEmail.trim().toLowerCase()) return null;
    if (parsed.assignmentId !== assignmentId) return null;
    if (!parsed.answers || typeof parsed.answers !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadSurveyDraft(accountEmail: string, assignmentId: string): SurveyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(accountEmail, assignmentId));
    if (!raw) return null;
    return parseDraft(raw, accountEmail, assignmentId);
  } catch {
    return null;
  }
}

export function saveSurveyDraft(input: {
  accountEmail: string;
  assignmentId: string;
  answers: Record<string, SurveyAnswerValue>;
  serverUpdatedAt?: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSurveyDraft(input.accountEmail, input.assignmentId);
    const draft: SurveyDraft = {
      version: DRAFT_VERSION,
      accountEmail: input.accountEmail.trim().toLowerCase(),
      assignmentId: input.assignmentId,
      answers: input.answers,
      savedAt: new Date().toISOString(),
      serverUpdatedAt: input.serverUpdatedAt ?? existing?.serverUpdatedAt,
    };
    localStorage.setItem(draftKey(input.accountEmail, input.assignmentId), JSON.stringify(draft));
  } catch {
    // localStorage may be unavailable in private mode — ignore
  }
}

export function clearSurveyDraft(accountEmail: string, assignmentId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(draftKey(accountEmail, assignmentId));
  } catch {
    // ignore
  }
}

export function surveyAnswersEqual(
  left: Record<string, SurveyAnswerValue>,
  right: Record<string, SurveyAnswerValue>
): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if (JSON.stringify(left[key] ?? null) !== JSON.stringify(right[key] ?? null)) return false;
  }
  return true;
}

function timestampMs(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Prefer the newer snapshot so a refresh restores unsaved local answers. */
export function resolveSurveyDraftAnswers(input: {
  serverAnswers: Record<string, SurveyAnswerValue>;
  serverUpdatedAt?: string | null;
  draft: SurveyDraft | null;
}): { answers: Record<string, SurveyAnswerValue>; restoredFromDraft: boolean } {
  const { serverAnswers, serverUpdatedAt, draft } = input;
  if (!draft) return { answers: serverAnswers, restoredFromDraft: false };
  if (surveyAnswersEqual(draft.answers, serverAnswers)) {
    return { answers: serverAnswers, restoredFromDraft: false };
  }
  if (timestampMs(draft.savedAt) >= timestampMs(serverUpdatedAt)) {
    return { answers: draft.answers, restoredFromDraft: true };
  }
  return { answers: serverAnswers, restoredFromDraft: false };
}
