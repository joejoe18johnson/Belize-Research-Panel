import { promises as fs } from "fs";
import path from "path";
import {
  calculateSurveyProgress,
  collectSurveyValidationIssues,
  SurveyValidationError,
  type SurveyAnswerValue,
} from "./survey-types";
import { findSurveyDefinitionById } from "./survey-definitions";
import { updateSurveyAssignmentProgress } from "./panelist-surveys-store";
import { findAssignmentForAccount } from "./survey-assignment-lookup";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";
import { assertCanPersistData, useSupabase } from "./supabase/data-source";
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
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadSurveyResponses } = await import("./supabase/repos");
    return supabaseLoadSurveyResponses();
  }
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as SurveyResponseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSurveyResponse(record: SurveyResponseRecord): Promise<void> {
  assertCanPersistData();
  if (useSupabase()) {
    const { supabaseUpsertSurveyResponse } = await import("./supabase/repos");
    await supabaseUpsertSurveyResponse(record);
    return;
  }
  const records = await loadSurveyResponsesRaw();
  const email = cleanText(record.panelistEmail).toLowerCase();
  const index = records.findIndex(
    (item) => item.assignmentId === record.assignmentId && cleanText(item.panelistEmail).toLowerCase() === email
  );
  if (index >= 0) records[index] = record;
  else records.push(record);
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function getSurveyResponse(
  assignmentId: string,
  panelistEmail: string
): Promise<SurveyResponseRecord | null> {
  const email = cleanText(panelistEmail).toLowerCase();
  if (useSupabase()) {
    const { supabaseLoadSurveyResponse } = await import("./supabase/repos");
    return supabaseLoadSurveyResponse(assignmentId, email);
  }
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
  return findAssignmentForAccount(assignmentId, panelistEmail);
}

async function recordCompletionPoints(assignment: PanelistSurveyRecord, panelistEmail: string): Promise<void> {
  if (!useSupabase() || assignment.points <= 0) return;
  const { supabaseRecordSurveyCompletionPoints } = await import("./supabase/repos");
  await supabaseRecordSurveyCompletionPoints({
    panelistEmail,
    campaignId: assignment.id,
    points: assignment.points,
    title: assignment.title,
  });
}

export async function saveSurveyProgress(input: {
  assignmentId: string;
  panelistEmail: string;
  answers: Record<string, SurveyAnswerValue>;
}): Promise<{ response: SurveyResponseRecord; progressPercent: number }> {
  const assignment = await findAssignment(input.assignmentId, input.panelistEmail);
  if (!assignment) throw new Error("Survey assignment not found.");
  if (!assignment.surveyDefinitionId) throw new Error("This assignment does not use an on-site survey.");

  const email = cleanText(input.panelistEmail).toLowerCase();
  const existing = await getSurveyResponse(input.assignmentId, email);
  if (assignment.status === "completed") {
    throw new Error("This survey has already been submitted.");
  }

  const definition = await findSurveyDefinitionById(assignment.surveyDefinitionId);
  if (!definition) throw new Error("Survey definition not found.");

  const now = new Date().toISOString();
  const progressPercent = calculateSurveyProgress(definition.questions, input.answers);
  const response: SurveyResponseRecord = {
    assignmentId: input.assignmentId,
    surveyDefinitionId: assignment.surveyDefinitionId,
    panelistEmail: email,
    answers: input.answers,
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    submittedAt: null,
  };

  await saveSurveyResponse(response);
  try {
    await updateSurveyAssignmentProgress(input.assignmentId, email, {
      progressPercent,
      status: progressPercent > 0 ? "in_progress" : "available",
      completedDate: null,
    });
  } catch (error) {
    console.error("[survey] assignment progress could not be updated", error);
  }

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

  const email = cleanText(input.panelistEmail).toLowerCase();
  const existing = await getSurveyResponse(input.assignmentId, email);
  if (assignment.status === "completed") {
    throw new Error("This survey has already been submitted.");
  }

  const definition = await findSurveyDefinitionById(assignment.surveyDefinitionId);
  if (!definition) throw new Error("Survey definition not found.");

  const issues = collectSurveyValidationIssues(definition.questions, input.answers);
  if (issues.length > 0) throw new SurveyValidationError(issues);

  const now = new Date().toISOString();
  const response: SurveyResponseRecord = {
    assignmentId: input.assignmentId,
    surveyDefinitionId: assignment.surveyDefinitionId,
    panelistEmail: email,
    answers: input.answers,
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    submittedAt: now,
  };

  await saveSurveyResponse(response);
  await updateSurveyAssignmentProgress(input.assignmentId, email, {
    progressPercent: 100,
    status: "completed",
    completedDate: now.slice(0, 10),
  });
  try {
    await recordCompletionPoints(assignment, email);
  } catch (error) {
    console.error("[survey] completion points could not be recorded", error);
  }

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

export async function loadSurveyResponsesForEmail(email: string): Promise<SurveyResponseRecord[]> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return [];
  if (useSupabase()) {
    const { supabaseLoadSurveyResponsesForEmail } = await import("./supabase/repos");
    return supabaseLoadSurveyResponsesForEmail(normalized);
  }
  const records = await loadSurveyResponsesRaw();
  return records.filter((record) => cleanText(record.panelistEmail).toLowerCase() === normalized);
}

export async function reassignSurveyResponseEmail(oldEmail: string, newEmail: string): Promise<void> {
  const from = cleanText(oldEmail).toLowerCase();
  const to = cleanText(newEmail).toLowerCase();
  if (!from || !to || from === to) return;
  if (useSupabase()) return;

  const records = await loadSurveyResponsesRaw();
  let changed = false;
  const next = records.map((record) => {
    if (cleanText(record.panelistEmail).toLowerCase() !== from) return record;
    changed = true;
    return { ...record, panelistEmail: to };
  });
  if (!changed) return;
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf-8");
}
