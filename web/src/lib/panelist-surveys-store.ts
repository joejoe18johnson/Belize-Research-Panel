import { promises as fs } from "fs";
import path from "path";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-surveys.json");

export async function loadSurveyRecordsFromFile(): Promise<PanelistSurveyRecord[]> {
  const { useSupabase } = await import("./supabase/data-source");
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

export async function saveSurveyRecordsToFile(records: PanelistSurveyRecord[]): Promise<void> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseSaveSurveyAssignments } = await import("./supabase/repos");
    await supabaseSaveSurveyAssignments(records);
    return;
  }
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}
