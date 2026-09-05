import { createHmac, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getSiteUrl } from "@/lib/seo/site-config";
import { cleanText } from "@/lib/validation";
import type { EmailTemplateId } from "./email-templates";

export type UnsubscribeScope = "outreach" | "all";

export interface EmailUnsubscribeRecord {
  email: string;
  scope: UnsubscribeScope;
  reason: string;
  updatedAt: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "email-unsubscribes.json");

const REQUIRED_TEMPLATES = new Set<EmailTemplateId>([
  "signup-verify-email",
  "password-reset",
  "staff-welcome",
  "staff-password-reset",
  "signup-admin-notification",
  "support-inbox-notification",
]);

const OUTREACH_TEMPLATES = new Set<EmailTemplateId>([
  "survey-invitation",
  "survey-reminder",
  "survey-completed",
]);

function normalizeEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

function tokenSecret(): string {
  return process.env.AUTH_SESSION_SECRET ?? "belize-research-panel-dev-secret";
}

export function createUnsubscribeToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ e: normalizeEmail(email) })).toString("base64url");
  const signature = createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function parseUnsubscribeToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as { e?: string };
    const email = normalizeEmail(parsed.e ?? "");
    return email || null;
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(email: string, origin?: string): string {
  const base = (origin || getSiteUrl()).replace(/\/$/, "");
  return `${base}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`;
}

export function buildUnsubscribeApiUrl(email: string, origin?: string): string {
  const base = (origin || getSiteUrl()).replace(/\/$/, "");
  return `${base}/api/email/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`;
}

export function templateOffersUnsubscribe(templateId: EmailTemplateId): boolean {
  return !REQUIRED_TEMPLATES.has(templateId) && templateId !== "account-deleted";
}

export function isOutreachTemplate(templateId: EmailTemplateId): boolean {
  return OUTREACH_TEMPLATES.has(templateId);
}

export function isRequiredTemplate(templateId: EmailTemplateId): boolean {
  return REQUIRED_TEMPLATES.has(templateId);
}

async function loadJsonStore(): Promise<Record<string, EmailUnsubscribeRecord>> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as Record<string, EmailUnsubscribeRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveJsonStore(store: Record<string, EmailUnsubscribeRecord>): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

export async function getEmailUnsubscribe(email: string): Promise<EmailUnsubscribeRecord | null> {
  const key = normalizeEmail(email);
  if (!key) return null;

  const { useSupabase } = await import("@/lib/supabase/data-source");
  if (useSupabase()) {
    try {
      const { supabaseGetEmailUnsubscribe } = await import("@/lib/supabase/repos");
      return await supabaseGetEmailUnsubscribe(key);
    } catch (error) {
      if (!(error instanceof Error && error.message === "missing_relation")) throw error;
    }
  }

  const store = await loadJsonStore();
  return store[key] ?? null;
}

export async function unsubscribeEmail(
  email: string,
  input: { scope: UnsubscribeScope; reason: string }
): Promise<EmailUnsubscribeRecord | null> {
  const key = normalizeEmail(email);
  if (!key) return null;

  const existing = await getEmailUnsubscribe(key);
  const scope: UnsubscribeScope = existing?.scope === "all" || input.scope === "all" ? "all" : "outreach";
  const record: EmailUnsubscribeRecord = {
    email: key,
    scope,
    reason: input.reason,
    updatedAt: new Date().toISOString(),
  };

  const { useSupabase } = await import("@/lib/supabase/data-source");
  if (useSupabase()) {
    try {
      const { supabaseUpsertEmailUnsubscribe } = await import("@/lib/supabase/repos");
      await supabaseUpsertEmailUnsubscribe(record);
      return record;
    } catch (error) {
      if (!(error instanceof Error && error.message === "missing_relation")) throw error;
    }
  }

  const store = await loadJsonStore();
  store[key] = record;
  await saveJsonStore(store);
  return record;
}

export async function getEmailUnsubscribeScope(email: string): Promise<UnsubscribeScope | null> {
  const record = await getEmailUnsubscribe(email);
  return record?.scope ?? null;
}

export async function unsubscribeClosedAccount(email: string): Promise<void> {
  try {
    await unsubscribeEmail(email, { scope: "all", reason: "account_closed" });
  } catch (error) {
    console.error("[email] could not record account-close unsubscribe", error);
  }
}

export async function unsubscribeFromOutreachToken(token: string): Promise<
  { ok: true; email: string; already: boolean; scope: UnsubscribeScope } | { ok: false; error: "invalid_token" }
> {
  const email = parseUnsubscribeToken(token);
  if (!email) return { ok: false, error: "invalid_token" };

  const existing = await getEmailUnsubscribe(email);
  if (existing) {
    return { ok: true, email, already: true, scope: existing.scope };
  }

  const record = await unsubscribeEmail(email, { scope: "outreach", reason: "user_request" });
  return { ok: true, email, already: false, scope: record?.scope ?? "outreach" };
}

export async function canSendToEmail(
  email: string,
  templateId: EmailTemplateId
): Promise<boolean> {
  if (isRequiredTemplate(templateId)) return true;
  const record = await getEmailUnsubscribe(email);
  if (!record) return true;
  if (record.scope === "all") return false;
  return !isOutreachTemplate(templateId);
}
