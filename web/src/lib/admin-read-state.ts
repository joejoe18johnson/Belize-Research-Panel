import { promises as fs } from "fs";
import path from "path";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "admin-read-state.json");

export interface AdminReadEntry {
  readAt: string;
}

export interface AdminReadState {
  notifications: Record<string, AdminReadEntry>;
  payouts: Record<string, AdminReadEntry>;
  campaigns: Record<string, AdminReadEntry>;
}

const EMPTY_STATE: AdminReadState = {
  notifications: {},
  payouts: {},
  campaigns: {},
};

async function loadStore(): Promise<AdminReadState> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as Partial<AdminReadState>;
    return {
      notifications: parsed.notifications && typeof parsed.notifications === "object" ? parsed.notifications : {},
      payouts: parsed.payouts && typeof parsed.payouts === "object" ? parsed.payouts : {},
      campaigns: parsed.campaigns && typeof parsed.campaigns === "object" ? parsed.campaigns : {},
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

async function saveStore(store: AdminReadState): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function adminNotificationId(type: string, email: string): string {
  return `${cleanText(type).toLowerCase()}:${cleanText(email).toLowerCase()}`;
}

export async function loadAdminReadState(): Promise<AdminReadState> {
  return loadStore();
}

export async function markAdminNotificationsRead(ids: string[]): Promise<AdminReadState> {
  const store = await loadStore();
  const now = new Date().toISOString();

  for (const rawId of ids) {
    const id = cleanText(rawId).toLowerCase();
    if (!id) continue;
    store.notifications[id] = { readAt: now };
  }

  await saveStore(store);
  return store;
}

export async function markAdminPayoutsRead(ids: string[]): Promise<AdminReadState> {
  const store = await loadStore();
  const now = new Date().toISOString();

  for (const rawId of ids) {
    const id = cleanText(rawId);
    if (!id) continue;
    store.payouts[id] = { readAt: now };
  }

  await saveStore(store);
  return store;
}

export function isAdminNotificationUnread(state: AdminReadState, id: string): boolean {
  return !state.notifications[cleanText(id).toLowerCase()];
}

export function isAdminPayoutUnread(state: AdminReadState, requestId: string): boolean {
  return !state.payouts[cleanText(requestId)];
}

export async function markAdminCampaignsRead(ids: string[]): Promise<AdminReadState> {
  const store = await loadStore();
  const now = new Date().toISOString();

  for (const rawId of ids) {
    const id = cleanText(rawId);
    if (!id) continue;
    store.campaigns[id] = { readAt: now };
  }

  await saveStore(store);
  return store;
}

export function isAdminCampaignUnread(state: AdminReadState, campaignId: string): boolean {
  return !state.campaigns[cleanText(campaignId)];
}
