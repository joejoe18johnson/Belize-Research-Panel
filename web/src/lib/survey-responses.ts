import { promises as fs } from "fs";
import path from "path";
import {
  calculateSurveyProgress,
  validateSurveySubmission,
  type SurveyAnswerValue,
} from "./survey-types";
import { findSurveyDefinitionById } from "./survey-definitions";
import { loadSurveyRecordsFromFile, saveSurveyRecordsToFile } from "./panelist-surveys-store";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "survey-responses.json");

export interface SurveyResponseRecord {
  assignmentId: string;
  surveyDefinitionId: string;
  panelistEmail: string;
  answers: Record<string, SurveyAnswerValue>;
  startedAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

async function loadSurveyResponsesRaw(): Promise<SurveyResponseRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as SurveyResponseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSurveyResponsesRaw(records: SurveyResponseRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

function responseKey(assignmentId: string, panelistEmail: string): string {
  return `${assignmentId}:${cleanText(panelistEmail).toLowerCase()}`;
}

export async function getSurveyResponse(
  assignmentId: string,
  panelistEmail: string
): Promise<SurveyResponseRecord | null> {
  const email = cleanText(panelistEmail).toLowerCase();
  const records = await loadSurveyResponsesRaw();
  return (
    records.find(
      (record) =>
        record.assignmentId === assignmentId && cleanText(record.panelistEmail).toLowerCase() === email
    ) ?? null
  );
}

async function findAssignment(
  assignmentId: string,
  panelistEmail: string
): Promise<PanelistSurveyRecord | null> {
  const email = cleanText(panelistEmail).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  return (
    assignments.find(
      (record) => record.id === assignmentId && cleanText(record.panelistEmail ?? "").toLowerCase() === email
    ) ?? null
  );
}

async function updateAssignmentProgress(
  assignmentId: string,
  panelistEmail: string,
  progressPercent: number,
  status: PanelistSurveyRecord["status"],
  completedDate: string | null
): Promise<void> {
  const email = cleanText(panelistEmail).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  const index = assignments.findIndex(
    (record) => record.id === assignmentId && cleanText(record.panelistEmail ?? "").toLowerCase() === email
  );
  if (index < 0) return;

  assignments[index] = {
    ...assignments[index],
    progressPercent,
    status,
    completedDate,
  };
  await saveSurveyRecordsToFile(assignments);
}

export async function saveSurveyProgress(input: {
  assignmentId: string;
  panelistEmail: string;
  answers: Record<string, SurveyAnswerValue>;
}): Promise<{ response: SurveyResponseRecord; progressPercent: number }> {
  const assignment = await findAssignment(input.assignmentId, input.panelistEmail);
  if (!assignment) throw new Error("Survey assignment not found.");
  if (!assignment.surveyDefinitionId) throw new Error("This assignment does not use an on-site survey.");
  if (assignment.status === "completed") throw new Error("This survey has already been submitted.");

  const definition = await findSurveyDefinitionById(assignment.surveyDefinitionId);
  if (!definition) throw new Error("Survey definition not found.");

  const now = new Date().toISOString();
  const email = cleanText(input.panelistEmail).toLowerCase();
  const records = await loadSurveyResponsesRaw();
  const index = records.findIndex(
    (record) =>
      record.assignmentId === input.assignmentId && cleanText(record.panelistEmail).toLowerCase() === email
  );

  const progressPercent = calculateSurveyProgress(definition.questions, input.answers);
  const existing = index >= 0 ? records[index] : null;
  const response: SurveyResponseRecord = {
    assignmentId: input.assignmentId,
    surveyDefinitionId: assignment.surveyDefinitionId,
    panelistEmail: email,
    answers: input.answers,
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    submittedAt: null,
  };

  if (index >= 0) records[index] = response;
  else records.push(response);

  await saveSurveyResponsesRaw(records);
  await updateAssignmentProgress(
    input.assignmentId,
    email,
    progressPercent,
    progressPercent > 0 ? "in_progress" : "available",
    null
  );

  return { response, progressPercent };
}

export async function submitSurveyResponse(input: {
  assignmentId: string;
  panelistEmail: string;
  answers: Record<string, SurveyAnswerValue>;
}): Promise<{ response: SurveyResponseRecord; points: number }> {
  const assignment = await findAssignment(input.assignmentId, input.panelistEmail);
  if (!assignment) throw new Error("Survey assignment not found.");
  if (!assignment.surveyDefinitionId) throw new Error("This assignment does not use an on-site survey.");
  if (assignment.status === "completed") throw new Error("This survey has already been submitted.");

  const definition = await findSurveyDefinitionById(assignment.surveyDefinitionId);
  if (!definition) throw new Error("Survey definition not found.");

  const errors = validateSurveySubmission(definition.questions, input.answers);
  if (errors.length > 0) throw new Error(errors[0]);

  const now = new Date().toISOString();
  const email = cleanText(input.panelistEmail).toLowerCase();
  const records = await loadSurveyResponsesRaw();
  const index = records.findIndex(
    (record) =>
      record.assignmentId === input.assignmentId && cleanText(record.panelistEmail).toLowerCase() === email
  );

  const response: SurveyResponseRecord = {
    assignmentId: input.assignmentId,
    surveyDefinitionId: assignment.surveyDefinitionId,
    panelistEmail: email,
    answers: input.answers,
    startedAt: index >= 0 ? records[index].startedAt : now,
    updatedAt: now,
    submittedAt: now,
  };

  if (index >= 0) records[index] = response;
  else records.push(response);

  await saveSurveyResponsesRaw(records);
  await updateAssignmentProgress(input.assignmentId, email, 100, "completed", now.slice(0, 10));

  return { response, points: assignment.points };
}

export async function loadSurveyResponsesForDefinition(surveyDefinitionId: string): Promise<SurveyResponseRecord[]> {
  const records = await loadSurveyResponsesRaw();
  return records.filter((record) => record.surveyDefinitionId === surveyDefinitionId);
}

export async function loadSurveyResponsesForCampaign(campaignId: string): Promise<SurveyResponseRecord[]> {
  const records = await loadSurveyResponsesRaw();
  return records.filter((record) => record.assignmentId === campaignId);
}
