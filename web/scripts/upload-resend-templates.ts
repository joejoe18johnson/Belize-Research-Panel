import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_SAMPLE_DATA,
  renderEmailTemplate,
  type EmailTemplateId,
} from "../src/lib/email/email-templates";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://api.resend.com";

/** Resend reserves FIRST_NAME, LAST_NAME, EMAIL — map those to custom keys. */
const RESERVED_VAR_ALIASES: Record<string, string> = {
  FIRST_NAME: "PANELIST_NAME",
  LAST_NAME: "PANELIST_LAST_NAME",
  EMAIL: "PANELIST_EMAIL",
};

type ResendTemplate = {
  id: string;
  name: string;
  alias?: string | null;
  status?: string;
};

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  let text = "";
  try {
    text = readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function toResendVarKey(appKey: string): string {
  const snake = appKey.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase();
  return RESERVED_VAR_ALIASES[snake] ?? snake;
}

function placeholderData(id: EmailTemplateId): Record<string, string> {
  const sample = EMAIL_TEMPLATE_SAMPLE_DATA[id];
  return Object.fromEntries(
    Object.keys(sample).map((key) => [key, `{{{${toResendVarKey(key)}}}}`])
  );
}

function extractVarKeys(...parts: string[]): string[] {
  const keys = new Set<string>();
  const re = /\{\{\{([A-Z][A-Z0-9_]*)\}\}\}/g;
  for (const part of parts) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(part))) {
      keys.add(match[1]);
    }
  }
  return [...keys];
}

function fallbackFor(id: EmailTemplateId, resendKey: string): string {
  const sample = EMAIL_TEMPLATE_SAMPLE_DATA[id];
  for (const [appKey, value] of Object.entries(sample)) {
    if (toResendVarKey(appKey) === resendKey) return value;
  }
  return "";
}

async function resend<T>(
  apiKey: string,
  method: string,
  pathname: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await response.json()) as T & { message?: string; name?: string };
  if (!response.ok) {
    throw new Error(`${method} ${pathname} → ${response.status}: ${json.message ?? JSON.stringify(json)}`);
  }
  return json;
}

async function listAllTemplates(apiKey: string): Promise<ResendTemplate[]> {
  const templates: ResendTemplate[] = [];
  let after: string | undefined;
  for (;;) {
    const qs = new URLSearchParams({ limit: "100" });
    if (after) qs.set("after", after);
    const page = await resend<{ data: ResendTemplate[]; has_more?: boolean }>(
      apiKey,
      "GET",
      `/templates?${qs.toString()}`
    );
    const rows = page.data ?? [];
    templates.push(...rows);
    if (!page.has_more || rows.length === 0) break;
    after = rows[rows.length - 1]?.id;
    if (!after) break;
  }
  return templates;
}

function templatePayload(id: EmailTemplateId, from: string) {
  const meta = EMAIL_TEMPLATES.find((item) => item.id === id);
  if (!meta) throw new Error(`Missing meta for ${id}`);
  const rendered = renderEmailTemplate(id, placeholderData(id));
  const keys = extractVarKeys(rendered.subject, rendered.html, rendered.text);
  return {
    name: meta.name,
    alias: id,
    from,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    variables: keys.map((key) => ({
      key,
      type: "string" as const,
      fallback_value: fallbackFor(id, key),
    })),
  };
}

async function main() {
  loadEnvLocal();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing. Add it to web/.env.local");
  }
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Belize Research Panel <onboarding@resend.dev>";

  const existing = await listAllTemplates(apiKey);
  const byAlias = new Map(
    existing
      .filter((item) => item.alias)
      .map((item) => [item.alias as string, item])
  );

  console.log(`Uploading ${EMAIL_TEMPLATES.length} templates to Resend as ${from}\n`);

  for (const meta of EMAIL_TEMPLATES) {
    const payload = templatePayload(meta.id, from);
    const current = byAlias.get(meta.id);
    let id: string;
    let action: "created" | "updated";
    if (current) {
      await resend(apiKey, "PATCH", `/templates/${current.id}`, payload);
      id = current.id;
      action = "updated";
    } else {
      const created = await resend<{ id: string }>(apiKey, "POST", "/templates", payload);
      id = created.id;
      action = "created";
    }
    await resend(apiKey, "POST", `/templates/${id}/publish`);
    const vars = payload.variables.map((item) => item.key).join(", ") || "(none)";
    console.log(`✓ ${action.padEnd(7)} ${meta.id}  (${id})  vars: ${vars}`);
  }

  console.log("\nDone. Open https://resend.com/templates to preview and send tests.");
  console.log("Send only to your Resend account email, or to delivered@resend.dev.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
