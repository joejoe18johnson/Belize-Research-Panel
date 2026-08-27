import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getSupportTopicLabel } from "./support-contact";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "support-messages.json");
const REPLY_TOPIC_PREFIX = "reply:";

export type SupportMessageStatus = "new" | "read";

export interface SupportReplyRecord {
  id: string;
  body: string;
  sentBy: string;
  sentAt: string;
}

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
  replies?: SupportReplyRecord[];
}

function isSupportReplyTopic(topic: string): boolean {
  return cleanText(topic).startsWith(REPLY_TOPIC_PREFIX);
}

function replyTopicFor(parentId: string): string {
  return `${REPLY_TOPIC_PREFIX}${parentId}`;
}

async function loadJsonSupportMessages(): Promise<SupportMessageRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as SupportMessageRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function loadRawSupportMessages(): Promise<SupportMessageRecord[]> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadSupportMessages } = await import("./supabase/repos");
    return supabaseLoadSupportMessages();
  }
  return loadJsonSupportMessages();
}

function assembleSupportThreads(records: SupportMessageRecord[]): SupportMessageRecord[] {
  const repliesByParent = new Map<string, SupportReplyRecord[]>();
  for (const record of records) {
    if (!isSupportReplyTopic(record.topic)) continue;
    const parentId = record.topic.slice(REPLY_TOPIC_PREFIX.length);
    const list = repliesByParent.get(parentId) ?? [];
    list.push({
      id: record.id,
      body: record.message,
      sentBy: record.name,
      sentAt: record.createdAt,
    });
    repliesByParent.set(parentId, list);
  }

  return records
    .filter((record) => !isSupportReplyTopic(record.topic))
    .map((record) => ({
      ...record,
      replies: (repliesByParent.get(record.id) ?? []).sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    }));
}

export async function loadSupportMessages(): Promise<SupportMessageRecord[]> {
  return assembleSupportThreads(await loadRawSupportMessages());
}

async function saveSupportMessages(messages: SupportMessageRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

async function persistSupportMessage(record: SupportMessageRecord): Promise<SupportMessageRecord> {
  const { useSupabase, assertCanPersistData } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseCreateSupportMessage } = await import("./supabase/repos");
    await supabaseCreateSupportMessage(record);
    return record;
  }

  assertCanPersistData();
  const messages = await loadJsonSupportMessages();
  messages.unshift(record);
  await saveSupportMessages(messages.slice(0, 500));
  return record;
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
    replies: [],
  };

  return persistSupportMessage(record);
}

export async function findSupportMessageById(id: string): Promise<SupportMessageRecord | null> {
  const requestId = cleanText(id);
  if (!requestId) return null;
  const messages = await loadSupportMessages();
  return messages.find((message) => message.id === requestId) ?? null;
}

export async function markSupportMessageRead(id: string): Promise<SupportMessageRecord | null> {
  const requestId = cleanText(id);
  if (!requestId) return null;

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseMarkSupportMessageRead } = await import("./supabase/repos");
    const updated = await supabaseMarkSupportMessageRead(requestId);
    if (!updated) return null;
    return (await findSupportMessageById(requestId)) ?? { ...updated, replies: [] };
  }

  const messages = await loadJsonSupportMessages();
  const index = messages.findIndex((message) => message.id === requestId && !isSupportReplyTopic(message.topic));
  if (index < 0) return null;

  messages[index] = {
    ...messages[index],
    status: "read",
    readAt: messages[index].readAt || new Date().toISOString(),
  };
  await saveSupportMessages(messages);
  return findSupportMessageById(requestId);
}

export async function appendSupportReply(input: {
  requestId: string;
  body: string;
  sentBy: string;
}): Promise<SupportMessageRecord | null> {
  const parent = await findSupportMessageById(input.requestId);
  if (!parent) return null;

  const now = new Date().toISOString();
  await persistSupportMessage({
    id: randomUUID(),
    name: cleanText(input.sentBy) || "Support team",
    email: parent.email,
    topic: replyTopicFor(parent.id),
    topicLabel: parent.topicLabel,
    message: cleanText(input.body),
    panelistEmail: parent.panelistEmail || parent.email,
    accountId: parent.accountId,
    status: "read",
    createdAt: now,
    readAt: now,
  });

  await markSupportMessageRead(parent.id);
  return findSupportMessageById(parent.id);
}

export function countUnreadSupportMessages(messages: SupportMessageRecord[]): number {
  return messages.filter((message) => !isSupportReplyTopic(message.topic) && message.status === "new").length;
}
