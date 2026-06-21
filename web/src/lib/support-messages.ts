import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getSupportTopicLabel } from "./support-contact";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "support-messages.json");

export type SupportMessageStatus = "new" | "read";

export interface SupportMessageRecord {
  id: string;
  name: string;
  email: string;
  topic: string;
  topicLabel: string;
  message: string;
  panelistEmail: string;
  accountId: string;
  status: SupportMessageStatus;
  createdAt: string;
  readAt: string;
}

export async function loadSupportMessages(): Promise<SupportMessageRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as SupportMessageRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSupportMessages(messages: SupportMessageRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

export async function createSupportMessage(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
  panelistEmail?: string;
  accountId?: string;
}): Promise<SupportMessageRecord> {
  const record: SupportMessageRecord = {
    id: randomUUID(),
    name: cleanText(input.name),
    email: cleanText(input.email).toLowerCase(),
    topic: cleanText(input.topic),
    topicLabel: getSupportTopicLabel(input.topic),
    message: cleanText(input.message),
    panelistEmail: cleanText(input.panelistEmail ?? "").toLowerCase(),
    accountId: cleanText(input.accountId ?? ""),
    status: "new",
    createdAt: new Date().toISOString(),
    readAt: "",
  };

  const messages = await loadSupportMessages();
  messages.unshift(record);
  await saveSupportMessages(messages.slice(0, 500));
  return record;
}

export async function markSupportMessageRead(id: string): Promise<SupportMessageRecord | null> {
  const messages = await loadSupportMessages();
  const index = messages.findIndex((message) => message.id === id);
  if (index < 0) return null;

  messages[index] = {
    ...messages[index],
    status: "read",
    readAt: messages[index].readAt || new Date().toISOString(),
  };
  await saveSupportMessages(messages);
  return messages[index];
}

export function countUnreadSupportMessages(messages: SupportMessageRecord[]): number {
  return messages.filter((message) => message.status === "new").length;
}
