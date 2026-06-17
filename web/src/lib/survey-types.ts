import type { SurveyCategory } from "./panelist-surveys-types";

export const SURVEY_QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "rating_scale",
  "yes_no",
] as const;

export type SurveyQuestionType = (typeof SURVEY_QUESTION_TYPES)[number];
export type SurveyDefinitionStatus = "draft" | "published" | "closed";

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  title: string;
  description: string;
  required: boolean;
  options: string[];
  scaleMin: number;
  scaleMax: number;
  scaleMinLabel: string;
  scaleMaxLabel: string;
}

export interface SurveyDefinition {
  id: string;
  title: string;
  description: string;
  companyIntro: string;
  companyLogoFile: string;
  coverImageFile: string;
  category: SurveyCategory;
  status: SurveyDefinitionStatus;
  questions: SurveyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export const SURVEY_QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  short_text: "Short answer",
  long_text: "Paragraph",
  single_choice: "Single choice (one answer)",
  multiple_choice: "Checkboxes (pick multiple)",
  dropdown: "Dropdown",
  rating_scale: "Linear scale",
  yes_no: "Yes / No",
};

export type SurveyAnswerValue = string | string[] | number;

function newQuestionId(): string {
  return `q-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyQuestion(type: SurveyQuestionType = "short_text"): SurveyQuestion {
  return {
    id: newQuestionId(),
    type,
    title: "",
    description: "",
    required: false,
    options: type === "yes_no" ? ["Yes", "No"] : ["Option 1", "Option 2"],
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: "Strongly disagree",
    scaleMaxLabel: "Strongly agree",
  };
}

const CHOICE_TYPES = new Set<SurveyQuestionType>(["single_choice", "multiple_choice", "dropdown"]);

export function sanitizeQuestionOptions(question: SurveyQuestion): SurveyQuestion {
  if (!CHOICE_TYPES.has(question.type)) return question;
  const options = question.options.map((option) => option.trim()).filter(Boolean);
  if (options.length >= 2) return { ...question, options };
  if (options.length === 1) return { ...question, options: [...options, "Option 2"] };
  return { ...question, options: ["Option 1", "Option 2"] };
}

export function hasAnswerForQuestion(question: SurveyQuestion, value: SurveyAnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (question.type === "multiple_choice") {
    return Array.isArray(value) && value.length > 0;
  }
  if (question.type === "rating_scale") {
    return typeof value === "number" && !Number.isNaN(value);
  }
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

export function calculateSurveyProgress(
  questions: SurveyQuestion[],
  answers: Record<string, SurveyAnswerValue>
): number {
  if (questions.length === 0) return 0;
  const answered = questions.filter((question) => hasAnswerForQuestion(question, answers[question.id])).length;
  return Math.round((answered / questions.length) * 100);
}

export function validateSurveySubmission(
  questions: SurveyQuestion[],
  answers: Record<string, SurveyAnswerValue>
): string[] {
  const errors: string[] = [];
  for (const question of questions) {
    if (!question.required) continue;
    if (!hasAnswerForQuestion(question, answers[question.id])) {
      errors.push(`"${question.title || "Untitled question"}" is required.`);
    }
  }
  return errors;
}
