import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { SurveyCategory } from "./panelist-surveys-types";
import type { SurveyCustomTemplate } from "./survey-custom-template-types";
import type { TemplateQuestionDraft } from "./survey-template-builders";
import { normalizeSurveyQuestion, type SurveyQuestion } from "./survey-definitions";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "survey-custom-templates.json");

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function questionsToDrafts(questions: Partial<SurveyQuestion>[]): TemplateQuestionDraft[] {
  return questions.map((question) => {
    const normalized = normalizeSurveyQuestion(question);
    const { id: _id, ...draft } = normalized;
    return draft;
  });
}

function normalizeTemplateRecord(record: SurveyCustomTemplate): SurveyCustomTemplate {
  return {
    id: cleanText(record.id),
    title: cleanText(record.title),
    description: cleanText(record.description),
    companyIntro: cleanText(record.companyIntro),
    category: record.category,
    questions: Array.isArray(record.questions)
      ? record.questions.map((question) => {
          const normalized = normalizeSurveyQuestion(question);
          const { id: _id, ...draft } = normalized;
          return draft;
        })
      : [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function loadSurveyCustomTemplates(): Promise<SurveyCustomTemplate[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as SurveyCustomTemplate[];
    return Array.isArray(parsed)
      ? parsed.map(normalizeTemplateRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];
  } catch {
    return [];
  }
}

async function saveSurveyCustomTemplates(templates: SurveyCustomTemplate[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(templates, null, 2), "utf-8");
}

export async function findSurveyCustomTemplateById(id: string): Promise<SurveyCustomTemplate | null> {
  const templates = await loadSurveyCustomTemplates();
  return templates.find((template) => template.id === id) ?? null;
}

export async function createSurveyCustomTemplate(input: {
  title: string;
  description?: string;
  companyIntro?: string;
  category: SurveyCategory;
  questions?: Partial<SurveyQuestion>[];
}): Promise<SurveyCustomTemplate> {
  const title = cleanText(input.title);
  if (!title) throw new Error("Template title is required.");

  const now = new Date().toISOString();
  const baseId = `template-${slugify(title) || "survey"}-${Date.now().toString(36)}`;
  const templates = await loadSurveyCustomTemplates();
  const id = templates.some((template) => template.id === baseId)
    ? `${baseId}-${randomUUID().slice(0, 6)}`
    : baseId;

  const template: SurveyCustomTemplate = {
    id,
    title,
    description: cleanText(input.description),
    companyIntro: cleanText(input.companyIntro),
    category: input.category,
    questions: questionsToDrafts(input.questions ?? []),
    createdAt: now,
    updatedAt: now,
  };

  templates.push(template);
  await saveSurveyCustomTemplates(templates);
  return template;
}

export async function updateSurveyCustomTemplate(
  id: string,
  input: {
    title?: string;
    description?: string;
    companyIntro?: string;
    category?: SurveyCategory;
    questions?: Partial<SurveyQuestion>[];
  }
): Promise<SurveyCustomTemplate> {
  const templates = await loadSurveyCustomTemplates();
  const index = templates.findIndex((template) => template.id === id);
  if (index < 0) throw new Error("Template not found.");

  const current = templates[index];
  const title = input.title !== undefined ? cleanText(input.title) : current.title;
  if (!title) throw new Error("Template title is required.");

  const updated: SurveyCustomTemplate = {
    ...current,
    title,
    description: input.description !== undefined ? cleanText(input.description) : current.description,
    companyIntro: input.companyIntro !== undefined ? cleanText(input.companyIntro) : current.companyIntro,
    category: input.category ?? current.category,
    questions:
      input.questions !== undefined ? questionsToDrafts(input.questions) : current.questions,
    updatedAt: new Date().toISOString(),
  };

  templates[index] = updated;
  await saveSurveyCustomTemplates(templates);
  return updated;
}

export async function deleteSurveyCustomTemplate(id: string): Promise<void> {
  const templates = await loadSurveyCustomTemplates();
  const next = templates.filter((template) => template.id !== id);
  if (next.length === templates.length) throw new Error("Template not found.");
  await saveSurveyCustomTemplates(next);
}
