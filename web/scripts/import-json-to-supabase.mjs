#!/usr/bin/env node
/**
 * Import web/data JSON + CSV into Supabase PostgreSQL.
 *
 * Usage (from web/):
 *   node scripts/import-json-to-supabase.mjs
 *   node scripts/import-json-to-supabase.mjs --dry-run
 *   node scripts/import-json-to-supabase.mjs --fresh
 *
 * Requires web/.env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Run supabase/apply-all.sql on the project before importing.
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFile, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(WEB_DIR, "data");

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FRESH = args.has("--fresh");

const BATCH_SIZE = 200;

// ─── Env ──────────────────────────────────────────────────────────────────────

async function loadEnvLocal() {
  const envPath = path.join(WEB_DIR, ".env.local");
  try {
    const content = await readFile(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env.local"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readJson(relativePath, fallback) {
  const filePath = path.join(DATA_DIR, relativePath);
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function fileExists(relativePath) {
  try {
    await access(path.join(DATA_DIR, relativePath));
    return true;
  } catch {
    return false;
  }
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function loadPanelistsCsv() {
  const filePath = path.join(DATA_DIR, "panelists.csv");
  try {
    const content = await readFile(filePath, "utf8");
    const lines = content.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];
    const headers = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? "";
      });
      return row;
    });
  } catch {
    return [];
  }
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

function parseBool(value) {
  const v = cleanText(value).toLowerCase();
  return v === "true" || v === "yes" || v === "1";
}

function parseDateOnly(value) {
  const v = cleanText(value);
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(v);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function parseTimestamp(value) {
  const v = cleanText(value);
  if (!v) return null;
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function splitInterests(value) {
  return cleanText(value)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function assignmentRowId(campaignId, email) {
  return `${campaignId}::${normalizeEmail(email)}`;
}

function isRegisteredVoter(row) {
  const voting = cleanText(row.voting_status).toLowerCase();
  const voter = cleanText(row.voter_status).toLowerCase();
  return voting === "yes" || voter.includes("registered");
}

const VERIFICATION_STATUSES = new Set([
  "Pending",
  "Verified",
  "Possible Duplicate",
  "Rejected",
  "Needs Follow-up",
]);

const PANELIST_STATUSES = new Set(["Active", "Inactive", "Suspended"]);

const HOLD_REASONS = new Set([
  "email_change",
  "phone_change",
  "email_and_phone",
  "fraud_review",
]);

function mapHoldReason(value) {
  const v = cleanText(value);
  return HOLD_REASONS.has(v) ? v : null;
}

function dedupeRowsByKey(rows, key) {
  const map = new Map();
  for (const row of rows) map.set(row[key], row);
  return [...map.values()];
}

async function upsertBatches(supabase, table, rows, { onConflict, label }) {
  if (!rows.length) {
    console.log(`  ${label}: 0 rows (skip)`);
    return;
  }
  if (DRY_RUN) {
    console.log(`  ${label}: ${rows.length} rows (dry-run)`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${label} batch ${i / BATCH_SIZE + 1}: ${error.message}`);
  }
  console.log(`  ${label}: ${rows.length} rows`);
}

async function insertBatches(supabase, table, rows, label) {
  if (!rows.length) {
    console.log(`  ${label}: 0 rows (skip)`);
    return;
  }
  if (DRY_RUN) {
    console.log(`  ${label}: ${rows.length} rows (dry-run)`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) throw new Error(`${label} batch ${i / BATCH_SIZE + 1}: ${error.message}`);
  }
  console.log(`  ${label}: ${rows.length} rows`);
}

async function clearTables(supabase) {
  const deletes = [
    { table: "survey_responses", filter: (q) => q.not("id", "is", null) },
    { table: "survey_assignments", filter: (q) => q.not("id", "is", null) },
    { table: "point_transactions", filter: (q) => q.not("id", "is", null) },
    { table: "redemption_requests", filter: (q) => q.not("id", "is", null) },
    { table: "panelist_notification_reads", filter: (q) => q.not("notification_id", "is", null) },
    { table: "admin_read_states", filter: (q) => q.not("id", "is", null) },
    { table: "outbound_messages", filter: (q) => q.not("id", "is", null) },
    { table: "support_messages", filter: (q) => q.not("id", "is", null) },
    { table: "panelist_uploads", filter: (q) => q.not("id", "is", null) },
    { table: "panelist_group_members", filter: (q) => q.not("group_id", "is", null) },
    { table: "campaigns", filter: (q) => q.not("id", "is", null) },
    { table: "panelist_groups", filter: (q) => q.not("id", "is", null) },
    { table: "survey_questions", filter: (q) => q.not("id", "is", null) },
    { table: "survey_definitions", filter: (q) => q.not("id", "is", null) },
    { table: "survey_custom_templates", filter: (q) => q.not("id", "is", null) },
    { table: "panelist_reward_balance_seeds", filter: (q) => q.not("panelist_email", "is", null) },
    { table: "panelist_points_overrides", filter: (q) => q.not("panelist_email", "is", null) },
    { table: "panelists", filter: (q) => q.not("id", "is", null) },
    { table: "accounts", filter: (q) => q.not("id", "is", null) },
    { table: "clients", filter: (q) => q.not("id", "is", null) },
    { table: "staff_users", filter: (q) => q.not("id", "is", null) },
  ];

  if (DRY_RUN) {
    console.log("  Would clear:", deletes.map((d) => d.table).join(", "));
    return;
  }

  for (const { table, filter } of deletes) {
    const { error } = await filter(supabase.from(table).delete());
    if (error) console.warn(`  Warning: could not clear ${table}: ${error.message}`);
  }
  console.log("  Cleared application tables");
}

async function verifySchema(supabase) {
  const { error } = await supabase.from("reward_settings").select("id").limit(1);
  if (error?.message?.includes("Could not find the table")) {
    throw new Error(
      "Database schema not found. Run supabase/apply-all.sql in the Supabase SQL Editor first."
    );
  }
  if (error) throw error;
}

// ─── Importers ────────────────────────────────────────────────────────────────

async function importRewardSettings(supabase) {
  const raw = await readJson("reward-settings.json", {});
  const row = {
    id: 1,
    registration_points: raw.registrationRewardPoints ?? 10,
    verification_points: raw.verificationRewardPoints ?? 25,
    minimum_redemption_points: raw.redemptionMinimumPoints ?? 500,
    points_per_bzd_dollar: raw.pointsPerBzDollar ?? 25,
    survey_reward_presets: raw.surveyRewardPresets ?? [100, 150, 200],
    updated_by: raw.updatedBy ?? null,
    updated_at: raw.updatedAt ?? new Date().toISOString(),
  };
  await upsertBatches(supabase, "reward_settings", [row], {
    onConflict: "id",
    label: "reward_settings",
  });
}

async function importStaffRoleModules(supabase) {
  const raw = await readJson("staff-role-access.json", { modules: {}, descriptions: {} });
  const defaults = {
    super_admin: {
      modules: [
        "admin-dashboard", "payouts", "fraud-prevention", "reward-settings", "notifications",
        "email-templates", "support-inbox", "user-roles", "panelists", "panelist-groups",
        "under-review", "sample-selection", "campaigns", "create-campaign", "survey-builder",
        "survey-templates", "survey-distribution", "distribution-engine", "fieldwork-management",
        "communication-notifications", "external-data-import", "advanced-analytics",
        "client-reporting", "client-project-management", "financial-revenue", "data-protection",
        "backup-recovery", "system-settings", "api-integrations", "deployment-production",
      ],
      description: "Full access to every admin module, settings, and platform controls.",
    },
    operations_manager: {
      modules: [
        "panelists", "panelist-groups", "admin-dashboard", "under-review", "notifications",
        "email-templates", "support-inbox", "payouts", "fraud-prevention", "sample-selection",
        "campaigns", "create-campaign", "reward-settings", "survey-builder", "survey-templates",
        "survey-distribution", "distribution-engine", "fieldwork-management",
        "communication-notifications", "external-data-import",
      ],
      description: "Panel register, campaigns, sampling, distribution, and fieldwork operations.",
    },
    research_analyst: {
      modules: [
        "admin-dashboard", "panelist-groups", "advanced-analytics", "survey-builder",
        "survey-templates", "survey-distribution", "distribution-engine", "client-reporting",
        "client-project-management",
      ],
      description: "Analytics, reporting, client projects, and survey distribution insights.",
    },
    field_supervisor: {
      modules: [
        "admin-dashboard", "under-review", "fieldwork-management", "fraud-prevention",
        "survey-distribution",
      ],
      description: "Fieldwork quality control, fraud review, and under-review queue.",
    },
    finance_officer: {
      modules: ["admin-dashboard", "payouts", "financial-revenue", "reward-settings"],
      description: "Payout requests, financial revenue, and redemption processing.",
    },
    client_viewer: {
      modules: ["client-reporting"],
      description: "Read-only access to assigned client reporting modules.",
    },
  };

  const roles = Object.keys(defaults);
  const rows = roles.map((role) => {
    const modules = raw.modules?.[role]?.length ? raw.modules[role] : defaults[role].modules;
    const description =
      raw.descriptions?.[role]?.trim() || defaults[role].description;
    return { role, modules, description };
  });

  await upsertBatches(supabase, "staff_role_modules", rows, {
    onConflict: "role",
    label: "staff_role_modules",
  });
}

async function importStaffUsers(supabase) {
  const raw = await readJson("staff-users.json", []);
  const rows = raw.map((user) => ({
    id: user.id,
    email: normalizeEmail(user.email),
    first_name: cleanText(user.first_name),
    last_name: cleanText(user.last_name),
    role: user.role,
    password_salt: user.password_salt,
    password_hash: user.password_hash,
    status: user.status === "inactive" ? "inactive" : "active",
    created_at: user.created_at ?? new Date().toISOString(),
    updated_at: user.updated_at ?? user.created_at ?? new Date().toISOString(),
  }));
  await upsertBatches(supabase, "staff_users", rows, {
    onConflict: "id",
    label: "staff_users",
  });
}

async function importClients(supabase) {
  const raw = await readJson("clients.json", []);
  const rows = raw.map((client) => ({
    id: client.id,
    name: cleanText(client.organization_name || client.name),
    contact_name: cleanText(client.contact_name),
    contact_email: normalizeEmail(client.email || client.contact_email),
    contact_phone: cleanText(client.contact_phone || ""),
    password_salt: client.password_salt,
    password_hash: client.password_hash,
    status: client.status === "inactive" ? "inactive" : "active",
    created_at: client.created_at ?? new Date().toISOString(),
    updated_at: client.updated_at ?? client.created_at ?? new Date().toISOString(),
  }));
  await upsertBatches(supabase, "clients", rows, {
    onConflict: "id",
    label: "clients",
  });
}

function normalizeAccountId(id) {
  const value = cleanText(id);
  if (value.startsWith("persona-")) return value.slice("persona-".length);
  return value;
}

async function importAccounts(supabase) {
  const raw = await readJson("accounts.json", []);
  const rows = raw.map((account) => ({
    id: normalizeAccountId(account.id),
    email: normalizeEmail(account.email),
    first_name: cleanText(account.first_name),
    last_name: cleanText(account.last_name),
    password_salt: account.password_salt,
    password_hash: account.password_hash,
    email_verified: parseBool(account.email_verified),
    verification_token: cleanText(account.verification_token),
    verification_sent_at: parseTimestamp(account.verification_sent_at),
    panelist_registered: parseBool(account.panelist_registered),
    created_at: account.created_at ?? new Date().toISOString(),
    updated_at: account.updated_at ?? account.created_at ?? new Date().toISOString(),
  }));
  await upsertBatches(supabase, "accounts", rows, {
    onConflict: "email",
    label: "accounts",
  });
  return new Map(rows.map((r) => [r.email, r.id]));
}

async function importPanelists(supabase, accountIdByEmail) {
  const csvRows = (await loadPanelistsCsv()).filter((row) => normalizeEmail(row.email));
  const accounts = await readJson("accounts.json", []);
  const accountByEmail = new Map(
    accounts.map((a) => [normalizeEmail(a.email), a])
  );

  const panelistIdByEmail = new Map();
  if (!DRY_RUN) {
    const { data, error } = await supabase.from("panelists").select("id, email");
    if (error) throw error;
    for (const row of data ?? []) {
      panelistIdByEmail.set(normalizeEmail(row.email), row.id);
    }
  }

  const rows = csvRows.map((row) => {
    const email = normalizeEmail(row.email);
    const id = panelistIdByEmail.get(email) ?? randomUUID();
    panelistIdByEmail.set(email, id);

    const account = accountByEmail.get(email);
    const verification = VERIFICATION_STATUSES.has(row.verification_status)
      ? row.verification_status
      : "Pending";
    const status = PANELIST_STATUSES.has(row.status) ? row.status : "Active";

    let accountStatus = "active";
    let accountHoldReason = null;
    if (account?.account_status === "on_hold") {
      accountStatus = "on_hold";
      accountHoldReason = mapHoldReason(account.hold_reason);
    }

    return {
      id,
      account_id: accountIdByEmail.get(email) ?? null,
      email,
      first_name: cleanText(row.first_name),
      last_name: cleanText(row.last_name),
      phone: cleanText(row.phone_whatsapp),
      date_of_birth: parseDateOnly(row.dob),
      gender: cleanText(row.sex),
      district: cleanText(row.district),
      constituency: cleanText(row.constituency),
      city_town_village: cleanText(row.city_town_village),
      registered_to_vote_in_belize: isRegisteredVoter(row),
      registered_constituency: cleanText(row.constituency),
      registered_city_town_village: cleanText(row.registered_ctv_area),
      market_research_interests: splitInterests(row.market_interests),
      verification_status: verification,
      status,
      account_status: accountStatus,
      account_hold_reason: accountHoldReason,
      email_verified: parseBool(row.admin_email_approved),
      phone_verified: parseBool(row.admin_phone_approved),
      id_verified: parseBool(row.admin_photo_id_approved),
      residence_verified: false,
      password_salt: cleanText(row.password_salt),
      password_hash: cleanText(row.password_hash),
      photo_id_path: "",
      residence_proof_path: "",
      registration_date: parseDateOnly(row.registration_date),
      last_login: null,
    };
  });

  await upsertBatches(supabase, "panelists", dedupeRowsByKey(rows, "email"), {
    onConflict: "email",
    label: "panelists",
  });

  if (!DRY_RUN) {
    const { data, error } = await supabase.from("panelists").select("id, email");
    if (error) throw error;
    panelistIdByEmail.clear();
    for (const row of data ?? []) {
      panelistIdByEmail.set(normalizeEmail(row.email), row.id);
    }
  }

  return panelistIdByEmail;
}

async function importSurveyDefinitions(supabase) {
  const raw = await readJson("survey-definitions.json", []);
  const definitions = [];
  const questions = [];

  for (const def of raw) {
    definitions.push({
      id: def.id,
      title: cleanText(def.title),
      description: cleanText(def.description || def.companyIntro || ""),
      category: def.category,
      status: def.status ?? "draft",
      estimated_minutes: def.estimatedMinutes ?? 10,
      points: def.points ?? 0,
      logo_path: cleanText(def.companyLogoFile || ""),
      cover_image_path: cleanText(def.coverImageFile || ""),
      created_by: null,
      created_at: def.createdAt ?? new Date().toISOString(),
      updated_at: def.updatedAt ?? def.createdAt ?? new Date().toISOString(),
    });

    (def.questions ?? []).forEach((q, index) => {
      questions.push({
        id: q.id || `${def.id}-q-${index}`,
        survey_definition_id: def.id,
        sort_order: index,
        type: q.type,
        prompt: cleanText(q.title || q.prompt),
        required: q.required !== false,
        options: q.options ?? [],
        scale_min: q.scaleMin ?? null,
        scale_max: q.scaleMax ?? null,
        scale_min_label: cleanText(q.scaleMinLabel || ""),
        scale_max_label: cleanText(q.scaleMaxLabel || ""),
      });
    });
  }

  await upsertBatches(supabase, "survey_definitions", definitions, {
    onConflict: "id",
    label: "survey_definitions",
  });
  await upsertBatches(supabase, "survey_questions", questions, {
    onConflict: "id",
    label: "survey_questions",
  });
}

async function importSurveyCustomTemplates(supabase) {
  const raw = await readJson("survey-custom-templates.json", []);
  const rows = raw.map((tpl) => ({
    id: tpl.id,
    name: cleanText(tpl.title || tpl.name),
    description: cleanText(tpl.description || tpl.companyIntro || ""),
    category: tpl.category,
    estimated_minutes: tpl.estimatedMinutes ?? 10,
    points: tpl.points ?? 0,
    questions: tpl.questions ?? [],
    created_at: tpl.createdAt ?? new Date().toISOString(),
    updated_at: tpl.updatedAt ?? tpl.createdAt ?? new Date().toISOString(),
  }));
  await upsertBatches(supabase, "survey_custom_templates", rows, {
    onConflict: "id",
    label: "survey_custom_templates",
  });
}

async function importPanelistGroups(supabase) {
  const raw = await readJson("panelist-groups.json", []);
  const rows = raw.map((group) => ({
    id: group.id,
    name: cleanText(group.name),
    description: cleanText(group.description),
    type: group.type === "filter" ? "filter" : "static",
    member_emails: (group.memberEmails ?? group.members ?? []).map(normalizeEmail),
    filter_districts: group.filters?.districts ?? [],
    filter_constituencies: group.filters?.constituencies ?? [],
    filter_registered_voters:
      group.filters?.registeredVotersOnly === true
        ? true
        : group.filters?.registeredVotersOnly === false
          ? false
          : null,
    filter_verification_statuses: group.filters?.verificationStatuses ?? null,
    created_at: group.createdAt ?? new Date().toISOString(),
    updated_at: group.updatedAt ?? group.createdAt ?? new Date().toISOString(),
  }));
  await upsertBatches(supabase, "panelist_groups", rows, {
    onConflict: "id",
    label: "panelist_groups",
  });
}

async function importCampaigns(supabase, panelistSurveys) {
  const raw = await readJson("campaigns.json", []);
  const surveyDefinitions = await readJson("survey-definitions.json", []);
  const validSurveyIds = new Set(surveyDefinitions.map((def) => def.id));
  const campaignIds = new Set(raw.map((c) => c.id));

  function resolveSurveyDefinitionId(value) {
    const id = cleanText(value);
    return id && validSurveyIds.has(id) ? id : null;
  }

  function mapCampaignRow(campaign) {
    const targeting = campaign.targeting ?? { mode: "all_verified" };
    return {
      id: campaign.id,
      title: cleanText(campaign.title),
      description: cleanText(campaign.description || ""),
      category: campaign.category,
      status: campaign.status ?? "draft",
      survey_url: cleanText(campaign.surveyUrl || ""),
      survey_definition_id: resolveSurveyDefinitionId(campaign.surveyDefinitionId),
      delivery_type: campaign.deliveryType === "internal" ? "internal" : "external",
      points: campaign.points ?? 0,
      assigned_date: parseDateOnly(campaign.assignedDate),
      complete_by_date: parseDateOnly(campaign.completeByDate),
      delivery_method: cleanText(campaign.deliveryMethod || ""),
      client_id: cleanText(campaign.clientId || "") || null,
      target_mode: targeting.mode,
      target_emails: (targeting.emails ?? []).map(normalizeEmail),
      target_districts: targeting.districts ?? [],
      target_constituencies: targeting.constituencies ?? [],
      target_constituency: cleanText(targeting.constituency || "") || null,
      target_panelist_group_id: cleanText(targeting.groupId || "") || null,
      target_market_interests: targeting.marketInterests ?? [],
      target_custom: targeting,
      created_at: campaign.createdAt ?? new Date().toISOString(),
      launched_at: parseTimestamp(campaign.launchedAt),
      cover_image_path: cleanText(campaign.coverImageFile || ""),
      updated_at: campaign.updatedAt ?? campaign.createdAt ?? new Date().toISOString(),
    };
  }

  // Legacy demo assignments use survey-* ids without a campaign row
  const legacyById = new Map();
  for (const assignment of panelistSurveys) {
    if (campaignIds.has(assignment.id)) continue;
    if (!legacyById.has(assignment.id)) legacyById.set(assignment.id, assignment);
  }

  const legacyCampaigns = [...legacyById.values()].map((assignment) => ({
    id: assignment.id,
    title: cleanText(assignment.title),
    description: "Imported legacy demo survey assignment",
    category: assignment.category,
    status: "closed",
    survey_url: cleanText(assignment.surveyUrl || ""),
      survey_definition_id: resolveSurveyDefinitionId(assignment.surveyDefinitionId),
    delivery_type: assignment.deliveryType === "internal" ? "internal" : "external",
    points: assignment.points ?? 0,
    assigned_date: parseDateOnly(assignment.assignedDate),
    complete_by_date: parseDateOnly(assignment.completeByDate),
    delivery_method: "Legacy import",
    client_id: null,
    target_mode: "specific_emails",
    target_emails: [],
    target_districts: [],
    target_constituencies: [],
    target_constituency: null,
    target_panelist_group_id: null,
    target_market_interests: [],
    target_custom: { mode: "legacy_import" },
    created_at: new Date().toISOString(),
    launched_at: null,
    updated_at: new Date().toISOString(),
  }));

  const rows = [...raw.map(mapCampaignRow), ...legacyCampaigns];
  await upsertBatches(supabase, "campaigns", rows, {
    onConflict: "id",
    label: "campaigns",
  });
  return campaignIds;
}

async function importSurveyAssignments(supabase, panelistIdByEmail) {
  const raw = await readJson("panelist-surveys.json", []);
  const surveyDefinitions = await readJson("survey-definitions.json", []);
  const validSurveyIds = new Set(surveyDefinitions.map((def) => def.id));
  const seen = new Set();
  const rows = [];

  for (const item of raw) {
    const email = normalizeEmail(item.panelistEmail);
    if (!email) continue;
    const campaignId = item.id;
    const dedupeKey = `${campaignId}::${email}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const surveyDefinitionId = cleanText(item.surveyDefinitionId || "");
    rows.push({
      id: assignmentRowId(campaignId, email),
      campaign_id: campaignId,
      panelist_id: panelistIdByEmail.get(email) ?? null,
      panelist_email: email,
      title: cleanText(item.title),
      description: "",
      category: item.category,
      status: item.status ?? "available",
      survey_url: cleanText(item.surveyUrl || ""),
      survey_definition_id:
        surveyDefinitionId && validSurveyIds.has(surveyDefinitionId)
          ? surveyDefinitionId
          : null,
      delivery_type: item.deliveryType === "internal" ? "internal" : "external",
      points: item.points ?? 0,
      assigned_date: parseDateOnly(item.assignedDate),
      complete_by_date: parseDateOnly(item.completeByDate),
      delivery_method: "",
    });
  }

  await upsertBatches(supabase, "survey_assignments", rows, {
    onConflict: "id",
    label: "survey_assignments",
  });
}

async function importSurveyResponses(supabase) {
  const raw = await readJson("survey-responses.json", []);
  const rows = raw.map((response) => ({
    id: randomUUID(),
    assignment_id: assignmentRowId(response.assignmentId, response.panelistEmail),
    panelist_email: normalizeEmail(response.panelistEmail),
    survey_definition_id: cleanText(response.surveyDefinitionId || "") || null,
    answers: response.answers ?? {},
    submitted_at: parseTimestamp(response.submittedAt) ?? new Date().toISOString(),
  }));
  await upsertBatches(supabase, "survey_responses", rows, {
    onConflict: "assignment_id",
    label: "survey_responses",
  });
}

async function importRewardBalances(supabase) {
  const raw = await readJson("panelist-reward-balances.json", {});
  const rows = Object.entries(raw).map(([email, balance]) => ({
    panelist_email: normalizeEmail(email),
    total_points: balance.totalPoints ?? balance.totalPointsToDate ?? 0,
    updated_at: new Date().toISOString(),
  }));
  await upsertBatches(supabase, "panelist_reward_balance_seeds", rows, {
    onConflict: "panelist_email",
    label: "panelist_reward_balance_seeds",
  });
}

async function importPointsOverrides(supabase) {
  const raw = await readJson("panelist-points-overrides.json", {});
  const rows = Object.entries(raw).map(([email, value]) => ({
    panelist_email: normalizeEmail(email),
    total_points: typeof value === "number" ? value : value.totalPoints,
    note: typeof value === "object" ? cleanText(value.note) : "",
    updated_by: typeof value === "object" ? cleanText(value.updatedBy) || null : null,
    updated_at: new Date().toISOString(),
  }));
  await upsertBatches(supabase, "panelist_points_overrides", rows, {
    onConflict: "panelist_email",
    label: "panelist_points_overrides",
  });
}

async function importRedemptionRequests(supabase, panelistIdByEmail) {
  const raw = await readJson("redemption-requests.json", {});
  const rows = [];
  for (const [email, requests] of Object.entries(raw)) {
    const panelistEmail = normalizeEmail(email);
    const panelistId = panelistIdByEmail.get(panelistEmail);
    if (!panelistId) continue;
    for (const req of requests ?? []) {
      rows.push({
        id: req.id,
        panelist_id: panelistId,
        panelist_email: panelistEmail,
        option_id: req.optionId,
        option_label: cleanText(req.optionLabel),
        points: req.points,
        amount_bz: req.amountBz ?? null,
        value_label: cleanText(req.valueLabel),
        status: req.status ?? "pending",
        details: req.details ?? {},
        notes: cleanText(req.notes),
        submitted_at: parseTimestamp(req.submittedAt) ?? new Date().toISOString(),
        updated_at: parseTimestamp(req.updatedAt) ?? new Date().toISOString(),
        processed_by: cleanText(req.processedBy) || null,
      });
    }
  }
  await upsertBatches(supabase, "redemption_requests", rows, {
    onConflict: "id",
    label: "redemption_requests",
  });
}

async function importNotificationReads(supabase) {
  const raw = await readJson("panelist-notification-state.json", {});
  const rows = [];
  for (const [email, notifications] of Object.entries(raw)) {
    const panelistEmail = normalizeEmail(email);
    for (const [notificationId, state] of Object.entries(notifications ?? {})) {
      rows.push({
        panelist_email: panelistEmail,
        notification_id: notificationId,
        read: Boolean(state.read),
        updated_at: parseTimestamp(state.updatedAt) ?? new Date().toISOString(),
      });
    }
  }
  await upsertBatches(supabase, "panelist_notification_reads", rows, {
    onConflict: "panelist_email,notification_id",
    label: "panelist_notification_reads",
  });
}

async function importAdminReadStates(supabase) {
  const raw = await readJson("admin-read-state.json", {});
  const rows = [];
  for (const [category, items] of Object.entries(raw)) {
    if (!["notifications", "payouts", "campaigns"].includes(category)) continue;
    const dbCategory =
      category === "notifications"
        ? "notification"
        : category === "payouts"
          ? "payout"
          : "campaign";
    for (const [itemId, state] of Object.entries(items ?? {})) {
      rows.push({
        staff_user_id: null,
        category: dbCategory,
        item_id: itemId,
        read_at: parseTimestamp(state.readAt) ?? new Date().toISOString(),
      });
    }
  }
  if (!DRY_RUN && rows.length) {
    await supabase
      .from("admin_read_states")
      .delete()
      .is("staff_user_id", null);
  }
  await insertBatches(supabase, "admin_read_states", rows, "admin_read_states");
}

async function importOutboundMessages(supabase) {
  const raw = await readJson("outbound-messages.json", []);
  const rows = raw.map((msg) => ({
    id: msg.id,
    email: normalizeEmail(msg.email),
    phone: cleanText(msg.phone),
    channel: msg.channel,
    subject: cleanText(msg.subject),
    body: cleanText(msg.body),
    context: cleanText(msg.context),
    delivery_status: msg.deliveryStatus ?? "logged",
    resend_id: cleanText(msg.resendId) || null,
    sent_at: parseTimestamp(msg.sentAt) ?? new Date().toISOString(),
  }));
  await upsertBatches(supabase, "outbound_messages", rows, {
    onConflict: "id",
    label: "outbound_messages",
  });
}

async function importSupportMessages(supabase, panelistIdByEmail) {
  if (!(await fileExists("support-messages.json"))) {
    console.log("  support_messages: file not found (skip)");
    return;
  }
  const raw = await readJson("support-messages.json", []);
  const rows = raw.map((msg) => {
    const panelistEmail = normalizeEmail(msg.panelistEmail || msg.email);
    return {
      id: msg.id,
      name: cleanText(msg.name),
      email: normalizeEmail(msg.email),
      topic: cleanText(msg.topic),
      topic_label: cleanText(msg.topicLabel),
      message: cleanText(msg.message),
      panelist_id: panelistIdByEmail.get(panelistEmail) ?? null,
      panelist_email: panelistEmail,
      account_id: cleanText(msg.accountId).startsWith("persona-")
        ? cleanText(msg.accountId).slice("persona-".length) || null
        : cleanText(msg.accountId) || null,
      status: msg.status ?? "new",
      created_at: parseTimestamp(msg.createdAt) ?? new Date().toISOString(),
      read_at: parseTimestamp(msg.readAt),
    };
  });
  await upsertBatches(supabase, "support_messages", rows, {
    onConflict: "id",
    label: "support_messages",
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await loadEnvLocal();
  const supabase = getSupabase();

  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== Import JSON → Supabase ===");
  console.log(`Project: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

  await verifySchema(supabase);

  if (FRESH) {
    console.log("Clearing existing data…");
    await clearTables(supabase);
    console.log("");
  }

  console.log("Importing…");

  await importRewardSettings(supabase);
  await importStaffRoleModules(supabase);
  await importStaffUsers(supabase);
  await importClients(supabase);
  const accountIdByEmail = await importAccounts(supabase);
  const panelistIdByEmail = await importPanelists(supabase, accountIdByEmail);
  await importSurveyDefinitions(supabase);
  await importSurveyCustomTemplates(supabase);
  await importPanelistGroups(supabase);

  const panelistSurveys = await readJson("panelist-surveys.json", []);
  await importCampaigns(supabase, panelistSurveys);
  await importSurveyAssignments(supabase, panelistIdByEmail);
  await importSurveyResponses(supabase);
  await importRewardBalances(supabase);
  await importPointsOverrides(supabase);
  await importRedemptionRequests(supabase, panelistIdByEmail);
  await importNotificationReads(supabase);
  await importAdminReadStates(supabase);
  await importOutboundMessages(supabase);
  await importSupportMessages(supabase, panelistIdByEmail);

  console.log("\nDone.");
  if (DRY_RUN) console.log("Re-run without --dry-run to write to Supabase.");
}

main().catch((error) => {
  console.error("\nImport failed:", error.message ?? error);
  process.exit(1);
});
