import { promises as fs } from "fs";
import path from "path";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-reward-balances.json");

export interface PanelistRewardBalanceSeed {
  totalPointsToDate?: number;
  totalPoints?: number;
}

type RewardBalanceStore = Record<string, PanelistRewardBalanceSeed>;

async function loadStore(): Promise<RewardBalanceStore> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as RewardBalanceStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

export async function loadRewardBalanceSeed(email: string): Promise<PanelistRewardBalanceSeed | null> {
  const key = normalizeEmail(email);
  if (!key) return null;
  const store = await loadStore();
  const seed = store[key];
  if (!seed || typeof seed !== "object") return null;
  return seed;
}
