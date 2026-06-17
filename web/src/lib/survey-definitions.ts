import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { SurveyCategory } from "./panelist-surveys-types";
import { cleanText } from "./validation";

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
  category: SurveyCategory;
  status: SurveyDefinitionStatus;
  questions: SurveyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export const SURVEY_QUESTION_TYPE_LABELS: Record<SurveyQuestionType, string> = {
  short_text: "Short answer",
  long_text: "Paragraph",
  single_choice: "Multiple choice",
  multiple_choice: "Checkboxes",
  dropdown: "Dropdown",
  rating_scale: "Linear scale",
  yes_no: "Yes / No",
};

const DATA_FILE = path.join(process.cwd(), "data", "survey-definitions.json");

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function createEmptyQuestion(type: SurveyQuestionType = "short_text"): SurveyQuestion {
  return {
    id: `q-${randomUUID().slice(0, 8)}`,
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

export function normalizeSurveyQuestion(input: Partial<SurveyQuestion>): SurveyQuestion {
  const type = SURVEY_QUESTION_TYPES.includes(input.type as SurveyQuestionType)
    ? (input.type as SurveyQuestionType)
    : "short_text";

  return {
    id: cleanText(input.id) || `q-${randomUUID().slice(0, 8)}`,
    type,
    title: cleanText(input.title),
    description: cleanText(input.description),
    required: Boolean(input.required),
    options:
      Array.isArray(input.options) && input.options.length > 0
        ? input.options.map((option) => cleanText(String(option))).filter(Boolean)
        : type === "yes_no"
          ? ["Yes", "No"]
          : ["Option 1", "Option 2"],
    scaleMin: Number.isFinite(Number(input.scaleMin)) ? Number(input.scaleMin) : 1,
    scaleMax: Number.isFinite(Number(input.scaleMax)) ? Number(input.scaleMax) : 5,
    scaleMinLabel: cleanText(input.scaleMinLabel) || "Low",
    scaleMaxLabel: cleanText(input.scaleMaxLabel) || "High",
  };
}

export async function loadSurveyDefinitions(): Promise<SurveyDefinition[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as SurveyDefinition[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSurveyDefinitions(definitions: SurveyDefinition[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(definitions, null, 2), "utf-8");
}

export async function findSurveyDefinitionById(id: string): Promise<SurveyDefinition | null> {
  const definitions = await loadSurveyDefinitions();
  return definitions.find((definition) => definition.id === id) ?? null;
}

export async function listPublishedSurveyDefinitions(): Promise<SurveyDefinition[]> {
  const definitions = await loadSurveyDefinitions();
  return definitions
    .filter((definition) => definition.status === "published")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createSurveyDefinition(input: {
  title: string;
  description?: string;
  category: SurveyCategory;
  status?: SurveyDefinitionStatus;
  questions?: Partial<SurveyQuestion>[];
}): Promise<SurveyDefinition> {
  const title = cleanText(input.title);
  if (!title) throw new Error("Survey title is required.");

  const now = new Date().toISOString();
  const baseId = `survey-${slugify(title) || "form"}-${Date.now().toString(36)}`;
  const definitions = await loadSurveyDefinitions();
  const id = definitions.some((definition) => definition.id === baseId)
    ? `${baseId}-${randomUUID().slice(0, 6)}`
    : baseId;

  const definition: SurveyDefinition = {
    id,
    title,
    description: cleanText(input.description),
    category: input.category,
    status: input.status ?? "draft",
    questions: (input.questions ?? [createEmptyQuestion()]).map(normalizeSurveyQuestion),
    createdAt: now,
    updatedAt: now,
  };

  definitions.push(definition);
  await saveSurveyDefinitions(definitions);
  return definition;
}

export async function updateSurveyDefinition(
  id: string,
  input: {
    title?: string;
    description?: string;
    category?: SurveyCategory;
    status?: SurveyDefinitionStatus;
    questions?: Partial<SurveyQuestion>[];
  }
): Promise<SurveyDefinition> {
  const definitions = await loadSurveyDefinitions();
  const index = definitions.findIndex((definition) => definition.id === id);
  if (index < 0) throw new Error("Survey not found.");

  const current = definitions[index];
  const title = input.title !== undefined ? cleanText(input.title) : current.title;
  if (!title) throw new Error("Survey title is required.");

  const updated: SurveyDefinition = {
    ...current,
    title,
    description: input.description !== undefined ? cleanText(input.description) : current.description,
    category: input.category ?? current.category,
    status: input.status ?? current.status,
    questions:
      input.questions !== undefined
        ? input.questions.map(normalizeSurveyQuestion)
        : current.questions,
    updatedAt: new Date().toISOString(),
  };

  definitions[index] = updated;
  await saveSurveyDefinitions(definitions);
  return updated;
}

export type SurveyAnswerValue = string | string[] | number;

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
