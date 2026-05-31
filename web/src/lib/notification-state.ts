import { promises as fs } from "fs";
import path from "path";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-notification-state.json");

export type NotificationReadState = Record<string, { read: boolean; updatedAt: string }>;

type NotificationStateStore = Record<string, NotificationReadState>;

async function loadStore(): Promise<NotificationStateStore> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as NotificationStateStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveStore(store: NotificationStateStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function normalizeEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

export async function loadNotificationReadState(email: string): Promise<NotificationReadState> {
  const key = normalizeEmail(email);
  if (!key) return {};
  const store = await loadStore();
  return store[key] ?? {};
}

export async function setNotificationRead(
  email: string,
  notificationId: string,
  read: boolean
): Promise<NotificationReadState> {
  const key = normalizeEmail(email);
  const id = cleanText(notificationId);
  if (!key || !id) return {};

  const store = await loadStore();
  const current = store[key] ?? {};

  current[id] = {
    read,
    updatedAt: new Date().toISOString(),
  };

  store[key] = current;
  await saveStore(store);
  return current;
}

export async function markAllNotificationsRead(
  email: string,
  notificationIds: string[]
): Promise<NotificationReadState> {
  const key = normalizeEmail(email);
  if (!key) return {};

  const store = await loadStore();
  const current = store[key] ?? {};
  const updatedAt = new Date().toISOString();

  for (const id of notificationIds) {
    const cleanId = cleanText(id);
    if (!cleanId) continue;
    current[cleanId] = { read: true, updatedAt };
  }

  store[key] = current;
  await saveStore(store);
  return current;
}
