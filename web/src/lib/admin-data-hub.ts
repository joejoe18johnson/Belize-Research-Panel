import { promises as fs } from "fs";
import path from "path";
import type { AccountRecord } from "./auth-types";
import { loadPanelists, type PanelistRow } from "./panelists";
import { loadSurveyRecordsFromFile } from "./panelist-surveys-store";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";
import type { RedemptionRequest } from "./reward-redemption";
import { cleanText } from "./validation";

const DATA_DIR = path.join(process.cwd(), "data");

export interface DataFileStat {
  path: string;
  label: string;
  exists: boolean;
  bytes: number;
  modifiedAt: string;
  rowCount: number | null;
}

export interface NotificationStateEntry {
  verification?: { read: boolean; updatedAt: string };
  surveys?: { read: boolean; updatedAt: string };
  rewards?: { read: boolean; updatedAt: string };
}

export interface AdminDataHub {
  panelists: PanelistRow[];
  surveyRecords: PanelistSurveyRecord[];
  redemptionRequests: RedemptionRequest[];
  accounts: AccountRecord[];
  notificationState: Record<string, NotificationStateEntry>;
  dataFiles: DataFileStat[];
  envFlags: Record<string, boolean>;
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function countCsvRows(filePath: string): Promise<number | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.trim().split("\n");
    return Math.max(0, lines.length - 1);
  } catch {
    return null;
  }
}

async function countJsonRecords(filePath: string): Promise<number | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed as Record<string, unknown>).reduce<number>((sum, value) => {
        if (Array.isArray(value)) return sum + value.length;
        return sum + 1;
      }, 0);
    }
    return null;
  } catch {
    return null;
  }
}

async function statDataFile(
  relativePath: string,
  label: string,
  rowCounter?: (fullPath: string) => Promise<number | null>
): Promise<DataFileStat> {
  const fullPath = path.join(DATA_DIR, relativePath);
  try {
    const stat = await fs.stat(fullPath);
    const rowCount = rowCounter ? await rowCounter(fullPath) : null;
    return {
      path: `data/${relativePath}`,
      label,
      exists: true,
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      rowCount,
    };
  } catch {
    return {
      path: `data/${relativePath}`,
      label,
      exists: false,
      bytes: 0,
      modifiedAt: "",
      rowCount: null,
    };
  }
}

export async function loadAllRedemptionRequests(): Promise<RedemptionRequest[]> {
  const store = await readJsonFile<Record<string, RedemptionRequest[]>>(path.join(DATA_DIR, "redemption-requests.json"), {});
  return Object.values(store).flat();
}

export async function loadAdminDataHub(): Promise<AdminDataHub> {
  const [panelists, surveyRecords, redemptionRequests, accounts, notificationState, dataFiles] = await Promise.all([
    loadPanelists(),
    loadSurveyRecordsFromFile(),
    loadAllRedemptionRequests(),
    readJsonFile<AccountRecord[]>(path.join(DATA_DIR, "accounts.json"), []),
    readJsonFile<Record<string, NotificationStateEntry>>(path.join(DATA_DIR, "panelist-notification-state.json"), {}),
    Promise.all([
      statDataFile("panelists.csv", "Panel register", countCsvRows),
      statDataFile("accounts.json", "Auth accounts", countJsonRecords),
      statDataFile("panelist-surveys.json", "Survey assignments", countJsonRecords),
      statDataFile("redemption-requests.json", "Redemption requests", countJsonRecords),
      statDataFile("panelist-reward-balances.json", "Reward balance seeds", countJsonRecords),
      statDataFile("panelist-points-overrides.json", "Points overrides", countJsonRecords),
      statDataFile("panelist-notification-state.json", "Notification read state", countJsonRecords),
    ]),
  ]);

  const envFlags: Record<string, boolean> = {
    AUTH_SESSION_SECRET: Boolean(process.env.AUTH_SESSION_SECRET),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
    ADMIN_API_KEY: Boolean(process.env.ADMIN_API_KEY),
    ENABLE_DEMO_ACCOUNTS: process.env.ENABLE_DEMO_ACCOUNTS === "true",
    NEXT_PUBLIC_SHOW_ADMIN_ENTRY: process.env.NEXT_PUBLIC_SHOW_ADMIN_ENTRY !== "false",
  };

  return {
    panelists,
    surveyRecords,
    redemptionRequests,
    accounts: Array.isArray(accounts) ? accounts : [],
    notificationState,
    dataFiles,
    envFlags,
  };
}

export function panelistByEmailMap(panelists: PanelistRow[]): Map<string, PanelistRow> {
  const map = new Map<string, PanelistRow>();
  for (const row of panelists) {
    const email = cleanText(row.email).toLowerCase();
    if (email) map.set(email, row);
  }
  return map;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-BZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
