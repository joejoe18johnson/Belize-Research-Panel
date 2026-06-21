import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { Resend } from "resend";
import { cleanText } from "@/lib/validation";

const DATA_FILE = path.join(process.cwd(), "data", "outbound-messages.json");

export interface OutboundMessageRecord {
  id: string;
  email: string;
  phone: string;
  channel: "email" | "whatsapp";
  subject: string;
  body: string;
  context: string;
  sentAt: string;
  resendId?: string;
  deliveryStatus: "sent" | "logged" | "failed";
}

async function loadMessages(): Promise<OutboundMessageRecord[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as OutboundMessageRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveMessages(messages: OutboundMessageRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

async function logOutboundMessage(input: Omit<OutboundMessageRecord, "id" | "sentAt">): Promise<void> {
  const messages = await loadMessages();
  messages.unshift({
    id: randomUUID(),
    sentAt: new Date().toISOString(),
    ...input,
  });
  await saveMessages(messages.slice(0, 500));
}

function resendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function fromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Belize Research Panel <onboarding@resend.dev>"
  );
}

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  context: string;
}): Promise<{ sent: boolean; logged: boolean; resendId?: string }> {
  const email = cleanText(input.to).toLowerCase();
  const subject = cleanText(input.subject);
  const html = input.html;
  const text = input.text ?? "";
  const context = cleanText(input.context);

  if (!email || !subject || !html) {
    return { sent: false, logged: false };
  }

  const client = resendClient();
  let deliveryStatus: OutboundMessageRecord["deliveryStatus"] = "logged";
  let resendId: string | undefined;

  if (client) {
    try {
      const result = await client.emails.send({
        from: fromAddress(),
        to: email,
        subject,
        html,
        text: text || undefined,
      });
      if (result.error) {
        deliveryStatus = "failed";
        console.error("[email]", context, result.error.message);
      } else {
        deliveryStatus = "sent";
        resendId = result.data?.id;
      }
    } catch (error) {
      deliveryStatus = "failed";
      console.error("[email]", context, error);
    }
  }

  await logOutboundMessage({
    email,
    phone: "",
    channel: "email",
    subject,
    body: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000),
    context,
    resendId,
    deliveryStatus,
  });

  return {
    sent: deliveryStatus === "sent",
    logged: true,
    resendId,
  };
}
