import { promises as fs } from "fs";
import path from "path";
import {
  DEFAULT_REWARD_SETTINGS,
  normalizeRewardSettings,
  type RewardSettings,
} from "./reward-settings";

const DATA_FILE = path.join(process.cwd(), "data", "reward-settings.json");

export async function loadRewardSettings(): Promise<RewardSettings> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as Partial<RewardSettings>;
    return normalizeRewardSettings(parsed);
  } catch {
    return { ...DEFAULT_REWARD_SETTINGS };
  }
}

export async function saveRewardSettings(
  settings: RewardSettings,
  updatedBy: string
): Promise<RewardSettings> {
  const next: RewardSettings = {
    ...normalizeRewardSettings(settings),
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), "utf-8");
  return next;
}
