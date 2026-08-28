import type { AccountRecord, AccountStatus, AccountHoldReason } from "../auth-types";
import type { PanelistRow } from "../panelists";
import type { PanelistSurveyRecord } from "../panelist-surveys-types";
import type { SurveyResponseRecord } from "../survey-responses";
import type { RedemptionRequest } from "../reward-redemption";
import type { RewardSettings } from "../reward-settings";
import type { CampaignRecord } from "../campaign-targeting";
import type { SurveyDefinition, SurveyQuestion, SurveyAnswerValue } from "../survey-types";
import type { StaffUserRecord } from "../staff-users";
import type { ClientUserRecord } from "../client-users";
import type { NotificationReadState } from "../notification-state";
import type { AdminReadState } from "../admin-read-state";
import type { SupportMessageRecord } from "../support-messages";
import { cleanText } from "../validation";
import { normalizePanelistEmail } from "./assignment-id";

type JsonObject = Record<string, unknown>;

function boolToString(value: boolean): string {
  return value ? "true" : "false";
}

function stringToBool(value: string | boolean | null | undefined): boolean {
  if (typeof value === "boolean") return value;
  const v = cleanText(String(value ?? "")).toLowerCase();
  return v === "true" || v === "yes" || v === "1";
}

function isoOrEmpty(value: string | null | undefined): string {
  if (!value) return "";
  return value;
}

function dateOnlyOrEmpty(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function parseFlexibleDateOnly(value: string | null | undefined): string | null {
  const v = cleanText(String(value ?? ""));
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = Date.parse(v);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return null;
}

function metadataString(meta: JsonObject, key: string): string {
  const value = meta[key];
  return cleanText(typeof value === "string" ? value : "");
}

export function accountRowToRecord(row: Record<string, unknown>): AccountRecord {
  const meta = (row.metadata as JsonObject) ?? {};
  return {
    id: String(row.id),
    first_name: cleanText(String(row.first_name)),
    last_name: cleanText(String(row.last_name)),
    email: cleanText(String(row.email)).toLowerCase(),
    password_salt: String(row.password_salt),
    password_hash: String(row.password_hash),
    email_verified: boolToString(Boolean(row.email_verified)),
    verification_token: cleanText(String(row.verification_token ?? "")),
    verification_sent_at: isoOrEmpty(row.verification_sent_at as string),
    created_at: isoOrEmpty(row.created_at as string),
    panelist_registered: boolToString(Boolean(row.panelist_registered)),
    citizenship_status: metadataString(meta, "citizenship_status"),
    commonwealth_country: metadataString(meta, "commonwealth_country"),
    dob: metadataString(meta, "dob"),
    account_status: (metadataString(meta, "account_status") || "active") as AccountStatus,
    hold_reason: metadataString(meta, "hold_reason") as AccountHoldReason,
    pending_email: metadataString(meta, "pending_email"),
    email_change_token: metadataString(meta, "email_change_token"),
    email_change_sent_at: metadataString(meta, "email_change_sent_at"),
    email_change_requested_at: metadataString(meta, "email_change_requested_at"),
    pending_phone_whatsapp: metadataString(meta, "pending_phone_whatsapp"),
    phone_change_requested_at: metadataString(meta, "phone_change_requested_at"),
    password_reset_token: metadataString(meta, "password_reset_token"),
    password_reset_sent_at: metadataString(meta, "password_reset_sent_at"),
  };
}

export function accountRecordToRow(account: AccountRecord): Record<string, unknown> {
  const metadata: JsonObject = {
    citizenship_status: account.citizenship_status ?? "",
    commonwealth_country: account.commonwealth_country ?? "",
    dob: account.dob ?? "",
    account_status: account.account_status ?? "active",
    hold_reason: account.hold_reason ?? "",
    pending_email: account.pending_email ?? "",
    email_change_token: account.email_change_token ?? "",
    email_change_sent_at: account.email_change_sent_at ?? "",
    email_change_requested_at: account.email_change_requested_at ?? "",
    pending_phone_whatsapp: account.pending_phone_whatsapp ?? "",
    phone_change_requested_at: account.phone_change_requested_at ?? "",
    password_reset_token: account.password_reset_token ?? "",
    password_reset_sent_at: account.password_reset_sent_at ?? "",
  };

  return {
    id: account.id,
    email: cleanText(account.email).toLowerCase(),
    first_name: account.first_name,
    last_name: account.last_name,
    password_salt: account.password_salt,
    password_hash: account.password_hash,
    email_verified: stringToBool(account.email_verified),
    verification_token: account.verification_token ?? "",
    verification_sent_at: account.verification_sent_at || null,
    panelist_registered: stringToBool(account.panelist_registered),
    created_at: account.created_at || new Date().toISOString(),
    metadata,
  };
}

export function panelistRowToRecord(row: Record<string, unknown>): PanelistRow {
  const meta = (row.metadata as JsonObject) ?? {};
  const marketInterests = Array.isArray(row.market_research_interests)
    ? (row.market_research_interests as string[]).join("; ")
    : metadataString(meta, "market_interests");

  return {
    registration_date: dateOnlyOrEmpty(row.registration_date as string),
    first_name: cleanText(String(row.first_name)),
    last_name: cleanText(String(row.last_name)),
    dob: dateOnlyOrEmpty(row.date_of_birth as string),
    age: metadataString(meta, "age"),
    citizenship_status: metadataString(meta, "citizenship_status"),
    commonwealth_country: metadataString(meta, "commonwealth_country"),
    voting_status: row.registered_to_vote_in_belize ? "Yes" : "No",
    voter_status: row.registered_to_vote_in_belize ? "Registered voter" : "Not applicable",
    place_of_residence: metadataString(meta, "place_of_residence") || cleanText(String(row.district)),
    district: cleanText(String(row.district)),
    city_town_village: cleanText(String(row.city_town_village)),
    country_if_abroad: metadataString(meta, "country_if_abroad"),
    constituency: cleanText(String(row.constituency)),
    registered_ctv_area: cleanText(String(row.registered_city_town_village)),
    sex: cleanText(String(row.gender)),
    education: metadataString(meta, "education"),
    ethnicity: metadataString(meta, "ethnicity"),
    household_head_relationship: metadataString(meta, "household_head_relationship"),
    household_size: metadataString(meta, "household_size"),
    political_interests: metadataString(meta, "political_interests"),
    market_interests: marketInterests,
    civic_interests: metadataString(meta, "civic_interests"),
    email: cleanText(String(row.email)).toLowerCase(),
    phone_whatsapp: cleanText(String(row.phone)),
    facebook: metadataString(meta, "facebook"),
    instagram: metadataString(meta, "instagram"),
    tiktok: metadataString(meta, "tiktok"),
    other_contact: metadataString(meta, "other_contact"),
    other_contact_platform: metadataString(meta, "other_contact_platform"),
    street_address: metadataString(meta, "street_address"),
    photo_id_type: metadataString(meta, "photo_id_type"),
    photo_id_last4: metadataString(meta, "photo_id_last4"),
    authorised_verification_code: metadataString(meta, "authorised_verification_code"),
    authorised_registrar_name: metadataString(meta, "authorised_registrar_name"),
    residence_region: metadataString(meta, "residence_region"),
    username: metadataString(meta, "username"),
    password_salt: cleanText(String(row.password_salt)),
    password_hash: cleanText(String(row.password_hash)),
    verification_status: cleanText(String(row.verification_status)),
    admin_email_approved: boolToString(Boolean(row.email_verified)),
    admin_phone_approved: boolToString(Boolean(row.phone_verified)),
    admin_photo_id_approved: boolToString(Boolean(row.id_verified)),
    consent_research: metadataString(meta, "consent_research") || "True",
    consent_contact: metadataString(meta, "consent_contact") || "True",
    consent_privacy: metadataString(meta, "consent_privacy") || "True",
    status: cleanText(String(row.status)),
    notes: metadataString(meta, "notes"),
  };
}

export function panelistRecordToRow(row: PanelistRow, id?: string): Record<string, unknown> {
  const metadata: JsonObject = {
    age: row.age ?? "",
    citizenship_status: row.citizenship_status ?? "",
    commonwealth_country: row.commonwealth_country ?? "",
    place_of_residence: row.place_of_residence ?? "",
    country_if_abroad: row.country_if_abroad ?? "",
    education: row.education ?? "",
    ethnicity: row.ethnicity ?? "",
    household_head_relationship: row.household_head_relationship ?? "",
    household_size: row.household_size ?? "",
    political_interests: row.political_interests ?? "",
    civic_interests: row.civic_interests ?? "",
    facebook: row.facebook ?? "",
    instagram: row.instagram ?? "",
    tiktok: row.tiktok ?? "",
    other_contact: row.other_contact ?? "",
    other_contact_platform: row.other_contact_platform ?? "",
    street_address: row.street_address ?? "",
    photo_id_type: row.photo_id_type ?? "",
    photo_id_last4: row.photo_id_last4 ?? "",
    authorised_verification_code: row.authorised_verification_code ?? "",
    authorised_registrar_name: row.authorised_registrar_name ?? "",
    residence_region: row.residence_region ?? "",
    username: row.username ?? "",
    consent_research: row.consent_research ?? "",
    consent_contact: row.consent_contact ?? "",
    consent_privacy: row.consent_privacy ?? "",
    notes: row.notes ?? "",
    market_interests: row.market_interests ?? "",
  };

  return {
    ...(id ? { id } : {}),
    email: cleanText(row.email).toLowerCase(),
    first_name: row.first_name,
    last_name: row.last_name,
    phone: row.phone_whatsapp ?? "",
    date_of_birth: parseFlexibleDateOnly(row.dob) || null,
    gender: row.sex ?? "",
    district: row.district ?? "",
    constituency: row.constituency ?? "",
    city_town_village: row.city_town_village ?? "",
    registered_to_vote_in_belize:
      cleanText(row.voting_status).toLowerCase() === "yes" ||
      cleanText(row.voter_status).toLowerCase().includes("registered"),
    registered_constituency: row.constituency ?? "",
    registered_city_town_village: row.registered_ctv_area ?? "",
    market_research_interests: cleanText(row.market_interests)
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean),
    verification_status: row.verification_status || "Pending",
    status: row.status || "Active",
    email_verified: stringToBool(row.admin_email_approved),
    phone_verified: stringToBool(row.admin_phone_approved),
    id_verified: stringToBool(row.admin_photo_id_approved),
    password_salt: row.password_salt ?? "",
    password_hash: row.password_hash ?? "",
    registration_date: parseFlexibleDateOnly(row.registration_date as string),
    metadata,
  };
}

export function assignmentRowToRecord(row: Record<string, unknown>): PanelistSurveyRecord {
  const status = cleanText(String(row.status)) as PanelistSurveyRecord["status"];
  const storedProgress = Number(row.progress_percent);
  const progressPercent = Number.isFinite(storedProgress)
    ? Math.min(100, Math.max(0, Math.round(storedProgress)))
    : status === "completed"
      ? 100
      : status === "in_progress"
        ? 50
        : 0;

  return {
    id: cleanText(String(row.campaign_id)),
    title: cleanText(String(row.title)),
    category: row.category as PanelistSurveyRecord["category"],
    assignedDate: dateOnlyOrEmpty(row.assigned_date as string),
    completeByDate: dateOnlyOrEmpty(row.complete_by_date as string),
    points: Number(row.points) || 0,
    status,
    progressPercent: status === "completed" ? 100 : progressPercent,
    completedDate:
      dateOnlyOrEmpty(row.completed_date as string) ||
      (status === "completed" ? dateOnlyOrEmpty(row.updated_at as string) || null : null),
    surveyUrl: cleanText(String(row.survey_url ?? "")) || null,
    surveyDefinitionId: cleanText(String(row.survey_definition_id ?? "")) || null,
    deliveryType: row.delivery_type as PanelistSurveyRecord["deliveryType"],
    panelistEmail: cleanText(String(row.panelist_email)).toLowerCase(),
  };
}

export function surveyResponseRowToRecord(row: Record<string, unknown>): SurveyResponseRecord {
  const campaignId = cleanText(String(row.assignment_id)).split("::")[0] || String(row.assignment_id);
  const submittedAt = row.submitted_at ? isoOrEmpty(row.submitted_at as string) : "";
  const startedAt = isoOrEmpty(row.started_at as string) || submittedAt;
  const updatedAt = isoOrEmpty(row.updated_at as string) || submittedAt || startedAt;
  return {
    assignmentId: campaignId,
    surveyDefinitionId: cleanText(String(row.survey_definition_id ?? "")),
    panelistEmail: normalizePanelistEmail(String(row.panelist_email)),
    answers: (row.answers as Record<string, SurveyAnswerValue>) ?? {},
    startedAt,
    updatedAt,
    submittedAt: submittedAt || null,
  };
}

export function surveyDefinitionRowsToDefinition(
  def: Record<string, unknown>,
  questions: Record<string, unknown>[]
): SurveyDefinition {
  return {
    id: String(def.id),
    title: cleanText(String(def.title)),
    description: cleanText(String(def.description)),
    companyIntro: cleanText(String(def.description)),
    companyLogoFile: cleanText(String(def.logo_path ?? "")),
    coverImageFile: cleanText(String(def.cover_image_path ?? "")),
    category: def.category as SurveyDefinition["category"],
    status: def.status as SurveyDefinition["status"],
    questions: questions
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .map(
        (q): SurveyQuestion => ({
          id: String(q.id),
          type: q.type as SurveyQuestion["type"],
          title: cleanText(String(q.prompt)),
          description: "",
          required: Boolean(q.required),
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          scaleMin: Number(q.scale_min) || 1,
          scaleMax: Number(q.scale_max) || 5,
          scaleMinLabel: cleanText(String(q.scale_min_label ?? "")),
          scaleMaxLabel: cleanText(String(q.scale_max_label ?? "")),
        })
      ),
    createdAt: isoOrEmpty(def.created_at as string),
    updatedAt: isoOrEmpty(def.updated_at as string),
  };
}

export function campaignRowToRecord(row: Record<string, unknown>): CampaignRecord {
  const targetCustom = (row.target_custom as JsonObject) ?? {};
  return {
    id: String(row.id),
    title: cleanText(String(row.title)),
    description: cleanText(String(row.description ?? "")),
    category: row.category as CampaignRecord["category"],
    status: row.status as CampaignRecord["status"],
    surveyUrl: cleanText(String(row.survey_url ?? "")),
    surveyDefinitionId: cleanText(String(row.survey_definition_id ?? "")) || undefined,
    deliveryType: row.delivery_type as CampaignRecord["deliveryType"],
    points: Number(row.points) || 0,
    assignedDate: dateOnlyOrEmpty(row.assigned_date as string),
    completeByDate: dateOnlyOrEmpty(row.complete_by_date as string),
    deliveryMethod: cleanText(String(row.delivery_method ?? "")),
    clientId: cleanText(String(row.client_id ?? "")) || undefined,
    targeting: {
      mode: row.target_mode as CampaignRecord["targeting"]["mode"],
      constituency: cleanText(String(row.target_constituency ?? "")) || undefined,
      districts: (row.target_districts as string[]) ?? [],
      constituencies: (row.target_constituencies as string[]) ?? [],
      emails: ((row.target_emails as string[]) ?? []).map((e) => cleanText(e).toLowerCase()),
      groupId: cleanText(String(row.target_panelist_group_id ?? "")) || undefined,
      groupName: cleanText(String(targetCustom.groupName ?? "")) || undefined,
    },
    createdAt: isoOrEmpty(row.created_at as string),
    launchedAt: isoOrEmpty(row.launched_at as string),
    coverImageFile:
      cleanText(String(row.cover_image_path ?? "")) ||
      cleanText(String(targetCustom.cover_image_path ?? "")),
    logoFile:
      cleanText(String(row.logo_path ?? "")) ||
      cleanText(String(targetCustom.logo_path ?? "")),
  };
}

export function rewardSettingsRowToSettings(row: Record<string, unknown>): RewardSettings {
  return {
    registrationRewardPoints: Number(row.registration_points) || 0,
    verificationRewardPoints: Number(row.verification_points) || 0,
    redemptionMinimumPoints: Number(row.minimum_redemption_points) || 0,
    pointsPerBzDollar: Number(row.points_per_bzd_dollar) || 25,
    surveyRewardPresets: Array.isArray(row.survey_reward_presets)
      ? (row.survey_reward_presets as number[])
      : [100, 150, 200],
    updatedAt: isoOrEmpty(row.updated_at as string),
    updatedBy: cleanText(String(row.updated_by ?? "")),
  };
}

export function supportRowToMessage(row: Record<string, unknown>): SupportMessageRecord {
  return {
    id: String(row.id),
    name: cleanText(String(row.name ?? "")),
    email: normalizePanelistEmail(String(row.email)),
    topic: cleanText(String(row.topic ?? "")),
    topicLabel: cleanText(String(row.topic_label ?? "")),
    message: cleanText(String(row.message ?? "")),
    panelistEmail: normalizePanelistEmail(String(row.panelist_email ?? "")),
    accountId: cleanText(String(row.account_id ?? "")),
    status: row.status === "read" ? "read" : "new",
    createdAt: isoOrEmpty(row.created_at as string),
    readAt: isoOrEmpty(row.read_at as string),
  };
}

export function redemptionRowToRequest(row: Record<string, unknown>): RedemptionRequest {
  return {
    id: String(row.id),
    email: normalizePanelistEmail(String(row.panelist_email)),
    optionId: row.option_id as RedemptionRequest["optionId"],
    optionLabel: cleanText(String(row.option_label ?? "")),
    points: Number(row.points) || 0,
    amountBz: row.amount_bz != null ? Number(row.amount_bz) : undefined,
    valueLabel: cleanText(String(row.value_label ?? "")),
    status: row.status as RedemptionRequest["status"],
    details: (row.details as Record<string, string>) ?? {},
    notes: cleanText(String(row.notes ?? "")),
    submittedAt: isoOrEmpty(row.submitted_at as string),
    updatedAt: isoOrEmpty(row.updated_at as string),
    processedBy: cleanText(String(row.processed_by ?? "")) || undefined,
  };
}

export function staffRowToRecord(row: Record<string, unknown>): StaffUserRecord {
  return {
    id: String(row.id),
    email: cleanText(String(row.email)).toLowerCase(),
    first_name: cleanText(String(row.first_name)),
    last_name: cleanText(String(row.last_name)),
    role: row.role as StaffUserRecord["role"],
    password_salt: String(row.password_salt),
    password_hash: String(row.password_hash),
    status: row.status === "inactive" ? "inactive" : "active",
    created_at: isoOrEmpty(row.created_at as string),
    updated_at: isoOrEmpty(row.updated_at as string) || undefined,
    password_reset_token: cleanText(String(row.password_reset_token ?? "")) || undefined,
    password_reset_sent_at: isoOrEmpty(row.password_reset_sent_at as string) || undefined,
  };
}

export function clientRowToRecord(row: Record<string, unknown>): ClientUserRecord {
  return {
    id: String(row.id),
    organization_name: cleanText(String(row.name)),
    contact_name: cleanText(String(row.contact_name ?? "")),
    email: cleanText(String(row.contact_email)).toLowerCase(),
    password_salt: String(row.password_salt),
    password_hash: String(row.password_hash),
    status: row.status === "inactive" ? "inactive" : "active",
    created_at: isoOrEmpty(row.created_at as string),
  };
}

export function notificationRowsToState(rows: Record<string, unknown>[]): NotificationReadState {
  const state: NotificationReadState = {};
  for (const row of rows) {
    state[String(row.notification_id)] = {
      read: Boolean(row.read),
      updatedAt: isoOrEmpty(row.updated_at as string),
    };
  }
  return state;
}

export function adminReadRowsToState(rows: Record<string, unknown>[]): AdminReadState {
  const state: AdminReadState = { notifications: {}, payouts: {}, campaigns: {} };
  for (const row of rows) {
    const itemId = String(row.item_id);
    const entry = { readAt: isoOrEmpty(row.read_at as string) };
    if (row.category === "notification") state.notifications[itemId] = entry;
    else if (row.category === "payout") state.payouts[itemId] = entry;
    else if (row.category === "campaign") state.campaigns[itemId] = entry;
  }
  return state;
}
