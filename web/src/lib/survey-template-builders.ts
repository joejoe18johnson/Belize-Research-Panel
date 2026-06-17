import type { SurveyQuestion, SurveyQuestionType } from "./survey-types";
import { createEmptyQuestion, sanitizeQuestionOptions } from "./survey-types";

export type TemplateQuestionDraft = Omit<SurveyQuestion, "id">;

export function draft(
  type: SurveyQuestionType,
  title: string,
  partial: Partial<TemplateQuestionDraft> = {}
): TemplateQuestionDraft {
  const base = createEmptyQuestion(type);
  return { ...base, title, ...partial };
}

export function yesNo(title: string, partial: Partial<TemplateQuestionDraft> = {}): TemplateQuestionDraft {
  return draft("yes_no", title, { required: true, ...partial });
}

export function scale(title: string, partial: Partial<TemplateQuestionDraft> = {}): TemplateQuestionDraft {
  return draft("rating_scale", title, {
    required: true,
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "Strongly disagree",
    scaleMaxLabel: "Strongly agree",
    ...partial,
  });
}

export function single(title: string, options: string[], partial: Partial<TemplateQuestionDraft> = {}): TemplateQuestionDraft {
  return draft("single_choice", title, { required: true, options, ...partial });
}

export function multi(title: string, options: string[], partial: Partial<TemplateQuestionDraft> = {}): TemplateQuestionDraft {
  return draft("multiple_choice", title, { required: true, options, ...partial });
}

export function dropdown(title: string, options: string[], partial: Partial<TemplateQuestionDraft> = {}): TemplateQuestionDraft {
  return draft("dropdown", title, { required: true, options, ...partial });
}

export function shortText(title: string, partial: Partial<TemplateQuestionDraft> = {}): TemplateQuestionDraft {
  return draft("short_text", title, { required: true, ...partial });
}

export function longText(title: string, partial: Partial<TemplateQuestionDraft> = {}): TemplateQuestionDraft {
  return draft("long_text", title, { required: true, ...partial });
}

export function instantiateTemplateQuestions(drafts: TemplateQuestionDraft[]): SurveyQuestion[] {
  return drafts.map((input) => {
    const base = createEmptyQuestion(input.type);
    return sanitizeQuestionOptions({ ...base, ...input, id: base.id });
  });
}
