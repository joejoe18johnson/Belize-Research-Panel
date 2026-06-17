import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  createEmptyQuestion,
  type SurveyDefinition,
  type SurveyDefinitionStatus,
  type SurveyQuestion,
  SURVEY_QUESTION_TYPES,
  type SurveyQuestionType,
} from "./survey-types";
import type { SurveyCategory } from "./panelist-surveys-types";
import { cleanText } from "./validation";

export type {
  SurveyAnswerValue,
  SurveyDefinition,
  SurveyDefinitionStatus,
  SurveyQuestion,
  SurveyQuestionType,
} from "./survey-types";

export {
  SURVEY_QUESTION_TYPES,
  SURVEY_QUESTION_TYPE_LABELS,
  calculateSurveyProgress,
  createEmptyQuestion,
  hasAnswerForQuestion,
  validateSurveySubmission,
} from "./survey-types";

const DATA_FILE = path.join(process.cwd(), "data", "survey-definitions.json");

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function normalizeSurveyQuestion(input: Partial<SurveyQuestion>): SurveyQuestion {
  const type = SURVEY_QUESTION_TYPES.includes(input.type as SurveyQuestionType)
    ? (input.type as SurveyQuestionType)
    : "short_text";

  return {
    id: cleanText(input.id) || createEmptyQuestion(type).id,
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

function normalizeSurveyDefinition(definition: SurveyDefinition): SurveyDefinition {
  return {
    ...definition,
    companyIntro: cleanText(definition.companyIntro),
    companyLogoFile: cleanText(definition.companyLogoFile),
    coverImageFile: cleanText(definition.coverImageFile),
  };
}

export async function loadSurveyDefinitions(): Promise<SurveyDefinition[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as SurveyDefinition[];
    return Array.isArray(parsed) ? parsed.map(normalizeSurveyDefinition) : [];
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
  companyIntro?: string;
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
    companyIntro: cleanText(input.companyIntro),
    companyLogoFile: "",
    coverImageFile: "",
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
    companyIntro?: string;
    companyLogoFile?: string;
    coverImageFile?: string;
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
    companyIntro: input.companyIntro !== undefined ? cleanText(input.companyIntro) : current.companyIntro ?? "",
    companyLogoFile:
      input.companyLogoFile !== undefined ? cleanText(input.companyLogoFile) : current.companyLogoFile ?? "",
    coverImageFile:
      input.coverImageFile !== undefined ? cleanText(input.coverImageFile) : current.coverImageFile ?? "",
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
