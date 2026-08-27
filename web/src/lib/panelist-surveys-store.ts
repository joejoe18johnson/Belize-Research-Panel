import { promises as fs } from "fs";
import path from "path";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";
import { assertCanPersistData, useSupabase } from "./supabase/data-source";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-surveys.json");

function assignmentKey(record: Pick<PanelistSurveyRecord, "id" | "panelistEmail">): string {
  return `${cleanText(record.id)}:${cleanText(record.panelistEmail ?? "").toLowerCase()}`;
}

export async function loadSurveyRecordsFromFile(): Promise<PanelistSurveyRecord[]> {
  if (useSupabase()) {
    const { supabaseLoadSurveyAssignments } = await import("./supabase/repos");
    return supabaseLoadSurveyAssignments();
  }
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as PanelistSurveyRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadSurveyRecordsForEmail(email: string): Promise<PanelistSurveyRecord[]> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return [];
  if (useSupabase()) {
    const { supabaseLoadSurveyAssignmentsForEmail } = await import("./supabase/repos");
    return supabaseLoadSurveyAssignmentsForEmail(normalized);
  }
  const records = await loadSurveyRecordsFromFile();
  return records.filter((record) => cleanText(record.panelistEmail ?? "").toLowerCase() === normalized);
}

export async function surveyAssignmentExistsForCampaign(campaignId: string): Promise<boolean> {
  const id = cleanText(campaignId);
  if (!id) return false;
  if (useSupabase()) {
    const { supabaseAssignmentExistsForCampaign } = await import("./supabase/repos");
    return supabaseAssignmentExistsForCampaign(id);
  }
  const records = await loadSurveyRecordsFromFile();
  return records.some((record) => cleanText(record.id) === id);
}

export async function saveSurveyRecordsToFile(records: PanelistSurveyRecord[]): Promise<void> {
  assertCanPersistData();
  if (useSupabase()) {
    const { supabaseSaveSurveyAssignments } = await import("./supabase/repos");
    await supabaseSaveSurveyAssignments(records);
    return;
  }
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export async function saveNewSurveyAssignments(records: PanelistSurveyRecord[]): Promise<void> {
  if (!records.length) return;
  assertCanPersistData();
  if (useSupabase()) {
    const { supabaseInsertNewSurveyAssignments } = await import("./supabase/repos");
    await supabaseInsertNewSurveyAssignments(records);
    return;
  }

  const existing = await loadSurveyRecordsFromFile();
  const keys = new Set(existing.map(assignmentKey));
  const next = [...existing];
  for (const record of records) {
    const key = assignmentKey(record);
    if (keys.has(key)) continue;
    keys.add(key);
    next.push(record);
  }
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf-8");
}

export async function updateSurveyAssignmentProgress(
  campaignId: string,
  panelistEmail: string,
  patch: {
    progressPercent: number;
    status: PanelistSurveyRecord["status"];
    completedDate: string | null;
  }
): Promise<void> {
  assertCanPersistData();
  if (useSupabase()) {
    const { supabaseUpdateSurveyAssignmentProgress } = await import("./supabase/repos");
    await supabaseUpdateSurveyAssignmentProgress(campaignId, panelistEmail, patch);
    return;
  }

  const email = cleanText(panelistEmail).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  const index = assignments.findIndex(
    (record) => record.id === campaignId && cleanText(record.panelistEmail ?? "").toLowerCase() === email
  );
  if (index < 0) return;
  if (assignments[index].status === "completed" && patch.status !== "completed") return;

  assignments[index] = {
    ...assignments[index],
    progressPercent: patch.progressPercent,
    status: patch.status,
    completedDate: patch.completedDate,
  };
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(assignments, null, 2), "utf-8");
}
