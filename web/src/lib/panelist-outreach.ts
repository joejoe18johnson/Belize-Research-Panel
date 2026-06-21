import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "outbound-messages.json");

export type OutreachChannel = "email" | "whatsapp";

export interface OutboundMessage {
  id: string;
  email: string;
  phone: string;
  channel: OutreachChannel;
  subject: string;
  body: string;
  context: string;
  sentAt: string;
  deliveryStatus?: "sent" | "logged" | "failed";
  resendId?: string;
}

async function loadMessages(): Promise<OutboundMessage[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as OutboundMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveMessages(messages: OutboundMessage[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

async function logOutboundMessage(input: Omit<OutboundMessage, "id" | "sentAt">): Promise<void> {
  const messages = await loadMessages();
  messages.unshift({
    id: randomUUID(),
    sentAt: new Date().toISOString(),
    ...input,
  });
  await saveMessages(messages.slice(0, 500));
}

/** Logs WhatsApp outreach for demo / future integration. Email uses Resend via process-emails. */
export async function logPanelistWhatsappOutreach(input: {
  email: string;
  phone?: string;
  body: string;
  context: string;
}): Promise<boolean> {
  const email = cleanText(input.email).toLowerCase();
  const phone = cleanText(input.phone ?? "");
  const body = cleanText(input.body);

  if (!phone || !body) return false;

  await logOutboundMessage({
    email,
    phone,
    channel: "whatsapp",
    subject: "Belize Research Panel",
    body,
    context: input.context,
    deliveryStatus: "logged",
  });

  return true;
}
