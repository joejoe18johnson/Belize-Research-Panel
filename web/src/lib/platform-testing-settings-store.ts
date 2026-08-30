import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_PLATFORM_TESTING_SETTINGS,
  normalizePlatformTestingSettings,
  type PlatformTestingSettings,
} from "./platform-testing-settings";

const DATA_FILE = path.join(process.cwd(), "data", "platform-testing.json");

export async function loadPlatformTestingSettings(): Promise<PlatformTestingSettings> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadPlatformTestingSettings } = await import("./supabase/repos");
    return supabaseLoadPlatformTestingSettings();
  }
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return normalizePlatformTestingSettings(JSON.parse(content) as Partial<PlatformTestingSettings>);
  } catch {
    return { ...DEFAULT_PLATFORM_TESTING_SETTINGS };
  }
}

export async function savePlatformTestingSettings(
  settings: PlatformTestingSettings,
  updatedBy: string
): Promise<PlatformTestingSettings> {
  const next = normalizePlatformTestingSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });

  const { useSupabase, assertCanPersistData } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseSavePlatformTestingSettings } = await import("./supabase/repos");
    return supabaseSavePlatformTestingSettings(next);
  }

  assertCanPersistData();
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}
