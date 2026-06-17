import { promises as fs } from "fs";
import path from "path";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-surveys.json");

export async function loadSurveyRecordsFromFile(): Promise<PanelistSurveyRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as PanelistSurveyRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSurveyRecordsToFile(records: PanelistSurveyRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
}
