import type { AccountRecord } from "../auth-types";
import type { PanelistRow } from "../panelists";
import type { PanelistSurveyRecord } from "../panelist-surveys-types";
import type { SurveyResponseRecord } from "../survey-responses";
import type { RedemptionRequest, RedemptionRequestStatus } from "../reward-redemption";
import type { RewardSettings } from "../reward-settings";
import type { CampaignRecord } from "../campaign-targeting";
import type { SurveyDefinition } from "../survey-types";
import type { StaffUserRecord } from "../staff-users";
import type { ClientUserRecord } from "../client-users";
import type { NotificationReadState } from "../notification-state";
import type { AdminReadState } from "../admin-read-state";
import { normalizeRewardSettings } from "../reward-settings";
import { cleanText } from "../validation";
import { getSupabaseAdmin } from "./server";
import { normalizePanelistEmail, resolveDbAssignmentId } from "./assignment-id";
import {
  accountRecordToRow,
  accountRowToRecord,
  adminReadRowsToState,
  assignmentRowToRecord,
  campaignRowToRecord,
  clientRowToRecord,
  notificationRowsToState,
  panelistRecordToRow,
  panelistRowToRecord,
  redemptionRowToRequest,
  rewardSettingsRowToSettings,
  staffRowToRecord,
  surveyDefinitionRowsToDefinition,
  surveyResponseRowToRecord,
} from "./mappers";

function db() {
  return getSupabaseAdmin();
}

function throwIfError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (error.code === "23505") {
    throw new Error("duplicate_key");
  }
  throw new Error(error.message);
}

export async function supabaseListAccounts(): Promise<AccountRecord[]> {
  const { data, error } = await db().from("accounts").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => accountRowToRecord(row as Record<string, unknown>));
}

export async function supabaseFindAccountByEmail(email: string): Promise<AccountRecord | null> {
  const normalized = cleanText(email).toLowerCase();
  const { data, error } = await db().from("accounts").select("*").eq("email", normalized).maybeSingle();
  throwIfError(error);
  return data ? accountRowToRecord(data as Record<string, unknown>) : null;
}

export async function supabaseFindAccountByVerificationToken(token: string): Promise<AccountRecord | null> {
  if (!token) return null;
  const { data, error } = await db()
    .from("accounts")
    .select("*")
    .eq("verification_token", token)
    .maybeSingle();
  throwIfError(error);
  return data ? accountRowToRecord(data as Record<string, unknown>) : null;
}

export async function supabaseInsertAccount(account: AccountRecord): Promise<void> {
  const { error } = await db().from("accounts").insert(accountRecordToRow(account));
  throwIfError(error);
}

export async function supabaseUpdateAccount(account: AccountRecord): Promise<void> {
  const row = accountRecordToRow(account);
  const { error } = await db()
    .from("accounts")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", account.id);
  throwIfError(error);
}

export async function supabaseUpsertAccounts(accounts: AccountRecord[]): Promise<void> {
  if (!accounts.length) return;
  const rows = accounts.map(accountRecordToRow);
  const { error } = await db().from("accounts").upsert(rows, { onConflict: "email" });
  throwIfError(error);
}

export async function supabaseListPanelists(): Promise<PanelistRow[]> {
  const { data, error } = await db().from("panelists").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => panelistRowToRecord(row as Record<string, unknown>));
}

export async function supabaseUpsertPanelists(rows: PanelistRow[], options?: { accountId?: string }): Promise<void> {
  if (!rows.length) return;
  const payload = rows.map((row) => ({
    ...panelistRecordToRow(row),
    ...(options?.accountId ? { account_id: options.accountId } : {}),
  }));
  const { error } = await db().from("panelists").upsert(payload, { onConflict: "email" });
  throwIfError(error);
}

export async function supabaseInsertPanelist(row: PanelistRow, accountId?: string): Promise<void> {
  const payload = {
    ...panelistRecordToRow(row),
    ...(accountId ? { account_id: accountId } : {}),
  };
  const { error } = await db().from("panelists").insert(payload);
  throwIfError(error);
}

export async function supabaseListStaffUsers(): Promise<StaffUserRecord[]> {
  const { data, error } = await db().from("staff_users").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => staffRowToRecord(row as Record<string, unknown>));
}

export async function supabaseUpsertStaffUsers(users: StaffUserRecord[]): Promise<void> {
  if (!users.length) return;
  const rows = users.map((user) => ({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    password_salt: user.password_salt,
    password_hash: user.password_hash,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at ?? user.created_at,
    password_reset_token: user.password_reset_token ?? "",
    password_reset_sent_at: user.password_reset_sent_at || null,
  }));
  const { error } = await db().from("staff_users").upsert(rows, { onConflict: "id" });
  throwIfError(error);
}

export async function supabaseListClientUsers(): Promise<ClientUserRecord[]> {
  const { data, error } = await db().from("clients").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => clientRowToRecord(row as Record<string, unknown>));
}

export async function supabaseLoadRewardSettings(): Promise<RewardSettings> {
  const { data, error } = await db().from("reward_settings").select("*").eq("id", 1).maybeSingle();
  throwIfError(error);
  if (!data) return normalizeRewardSettings({});
  return normalizeRewardSettings(rewardSettingsRowToSettings(data as Record<string, unknown>));
}

export async function supabaseSaveRewardSettings(
  settings: RewardSettings,
  updatedBy: string
): Promise<RewardSettings> {
  const next = normalizeRewardSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });
  const { error } = await db().from("reward_settings").upsert({
    id: 1,
    registration_points: next.registrationRewardPoints,
    verification_points: next.verificationRewardPoints,
    minimum_redemption_points: next.redemptionMinimumPoints,
    points_per_bzd_dollar: next.pointsPerBzDollar,
    survey_reward_presets: next.surveyRewardPresets,
    updated_by: updatedBy,
    updated_at: next.updatedAt,
  });
  throwIfError(error);
  return next;
}

export async function supabaseLoadSurveyAssignments(): Promise<PanelistSurveyRecord[]> {
  const { data, error } = await db().from("survey_assignments").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => assignmentRowToRecord(row as Record<string, unknown>));
}

export async function supabaseSaveSurveyAssignments(records: PanelistSurveyRecord[]): Promise<void> {
  if (!records.length) return;
  const rows = records.map((record) => {
    const email = normalizePanelistEmail(record.panelistEmail ?? "");
    return {
      id: resolveDbAssignmentId(record.id, email),
      campaign_id: record.id,
      panelist_email: email,
      title: record.title,
      description: "",
      category: record.category,
      status: record.status,
      survey_url: record.surveyUrl ?? "",
      survey_definition_id: record.surveyDefinitionId || null,
      delivery_type: record.deliveryType ?? "external",
      points: record.points,
      assigned_date: record.assignedDate || null,
      complete_by_date: record.completeByDate || null,
      delivery_method: "",
      updated_at: new Date().toISOString(),
    };
  });
  const { error } = await db().from("survey_assignments").upsert(rows, { onConflict: "id" });
  throwIfError(error);
}

export async function supabaseLoadSurveyDefinitions(): Promise<SurveyDefinition[]> {
  const { data: defs, error: defError } = await db().from("survey_definitions").select("*");
  throwIfError(defError);
  const { data: questions, error: qError } = await db().from("survey_questions").select("*");
  throwIfError(qError);
  const questionsByDef = new Map<string, Record<string, unknown>[]>();
  for (const q of questions ?? []) {
    const defId = String((q as Record<string, unknown>).survey_definition_id);
    const list = questionsByDef.get(defId) ?? [];
    list.push(q as Record<string, unknown>);
    questionsByDef.set(defId, list);
  }
  return (defs ?? []).map((def) =>
    surveyDefinitionRowsToDefinition(
      def as Record<string, unknown>,
      questionsByDef.get(String((def as Record<string, unknown>).id)) ?? []
    )
  );
}

export async function supabaseLoadSurveyResponses(): Promise<SurveyResponseRecord[]> {
  const { data, error } = await db().from("survey_responses").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => surveyResponseRowToRecord(row as Record<string, unknown>));
}

export async function supabaseUpsertSurveyResponse(response: SurveyResponseRecord): Promise<void> {
  const email = normalizePanelistEmail(response.panelistEmail);
  const { error } = await db().from("survey_responses").upsert(
    {
      assignment_id: resolveDbAssignmentId(response.assignmentId, email),
      panelist_email: email,
      survey_definition_id: response.surveyDefinitionId || null,
      answers: response.answers,
      submitted_at: response.submittedAt || new Date().toISOString(),
    },
    { onConflict: "assignment_id" }
  );
  throwIfError(error);
}

export async function supabaseLoadCampaigns(): Promise<CampaignRecord[]> {
  const { data, error } = await db().from("campaigns").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => campaignRowToRecord(row as Record<string, unknown>));
}

export async function supabaseUpsertCampaigns(campaigns: CampaignRecord[]): Promise<void> {
  if (!campaigns.length) return;
  const rows = campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    category: campaign.category,
    status: campaign.status,
    survey_url: campaign.surveyUrl,
    survey_definition_id: campaign.surveyDefinitionId || null,
    delivery_type: campaign.deliveryType,
    points: campaign.points,
    assigned_date: campaign.assignedDate || null,
    complete_by_date: campaign.completeByDate || null,
    delivery_method: campaign.deliveryMethod,
    client_id: campaign.clientId || null,
    target_mode: campaign.targeting.mode,
    target_emails: campaign.targeting.emails ?? [],
    target_districts: campaign.targeting.districts ?? [],
    target_constituencies: campaign.targeting.constituencies ?? [],
    target_constituency: campaign.targeting.constituency || null,
    target_panelist_group_id: campaign.targeting.groupId || null,
    target_market_interests: [],
    target_custom: campaign.targeting,
    created_at: campaign.createdAt,
    launched_at: campaign.launchedAt || null,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await db().from("campaigns").upsert(rows, { onConflict: "id" });
  throwIfError(error);
}

export async function supabaseLoadAllRedemptionRequests(): Promise<RedemptionRequest[]> {
  const { data, error } = await db()
    .from("redemption_requests")
    .select("*")
    .order("submitted_at", { ascending: false });
  throwIfError(error);
  return (data ?? []).map((row) => redemptionRowToRequest(row as Record<string, unknown>));
}

export async function supabaseLoadRedemptionRequests(email: string): Promise<RedemptionRequest[]> {
  const normalized = normalizePanelistEmail(email);
  const all = await supabaseLoadAllRedemptionRequests();
  return all.filter((request) => request.email === normalized);
}

export async function supabaseUpsertRedemptionRequest(request: RedemptionRequest): Promise<void> {
  const { data: panelist } = await db()
    .from("panelists")
    .select("id")
    .eq("email", request.email)
    .maybeSingle();
  const { error } = await db().from("redemption_requests").upsert({
    id: request.id,
    panelist_id: panelist?.id,
    panelist_email: request.email,
    option_id: request.optionId,
    option_label: request.optionLabel,
    points: request.points,
    amount_bz: request.amountBz ?? null,
    value_label: request.valueLabel,
    status: request.status,
    details: request.details,
    notes: request.notes,
    submitted_at: request.submittedAt,
    updated_at: request.updatedAt,
    processed_by: request.processedBy ?? null,
  });
  throwIfError(error);
}

export async function supabaseUpdateRedemptionStatus(
  requestId: string,
  status: RedemptionRequestStatus,
  processedBy?: string
): Promise<void> {
  const { error } = await db()
    .from("redemption_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
      processed_by: processedBy ?? null,
    })
    .eq("id", requestId);
  throwIfError(error);
}

export async function supabaseLoadPointsOverride(email: string): Promise<number | null> {
  const { data, error } = await db()
    .from("panelist_points_overrides")
    .select("total_points")
    .eq("panelist_email", normalizePanelistEmail(email))
    .maybeSingle();
  throwIfError(error);
  return data?.total_points ?? null;
}

export async function supabaseSetPointsOverride(email: string, points: number | null): Promise<void> {
  const key = normalizePanelistEmail(email);
  if (points === null) {
    const { error } = await db().from("panelist_points_overrides").delete().eq("panelist_email", key);
    throwIfError(error);
    return;
  }
  const { error } = await db().from("panelist_points_overrides").upsert({
    panelist_email: key,
    total_points: points,
    note: "",
    updated_at: new Date().toISOString(),
  });
  throwIfError(error);
}

export async function supabaseLoadRewardBalanceSeed(email: string): Promise<number | null> {
  const { data, error } = await db()
    .from("panelist_reward_balance_seeds")
    .select("total_points")
    .eq("panelist_email", normalizePanelistEmail(email))
    .maybeSingle();
  throwIfError(error);
  return data?.total_points ?? null;
}

export async function supabaseLoadNotificationReadState(email: string): Promise<NotificationReadState> {
  const { data, error } = await db()
    .from("panelist_notification_reads")
    .select("*")
    .eq("panelist_email", normalizePanelistEmail(email));
  throwIfError(error);
  return notificationRowsToState((data ?? []) as Record<string, unknown>[]);
}

export async function supabaseSaveNotificationReadState(
  email: string,
  state: NotificationReadState
): Promise<void> {
  const key = normalizePanelistEmail(email);
  const rows = Object.entries(state).map(([notificationId, entry]) => ({
    panelist_email: key,
    notification_id: notificationId,
    read: entry.read,
    updated_at: entry.updatedAt || new Date().toISOString(),
  }));
  if (!rows.length) return;
  const { error } = await db()
    .from("panelist_notification_reads")
    .upsert(rows, { onConflict: "panelist_email,notification_id" });
  throwIfError(error);
}

export async function supabaseLoadAdminReadState(): Promise<AdminReadState> {
  const { data, error } = await db().from("admin_read_states").select("*").is("staff_user_id", null);
  throwIfError(error);
  return adminReadRowsToState((data ?? []) as Record<string, unknown>[]);
}

export async function supabaseSaveAdminReadState(state: AdminReadState): Promise<void> {
  await db().from("admin_read_states").delete().is("staff_user_id", null);
  const rows: Record<string, unknown>[] = [];
  for (const [id, entry] of Object.entries(state.notifications)) {
    rows.push({ staff_user_id: null, category: "notification", item_id: id, read_at: entry.readAt });
  }
  for (const [id, entry] of Object.entries(state.payouts)) {
    rows.push({ staff_user_id: null, category: "payout", item_id: id, read_at: entry.readAt });
  }
  for (const [id, entry] of Object.entries(state.campaigns)) {
    rows.push({ staff_user_id: null, category: "campaign", item_id: id, read_at: entry.readAt });
  }
  if (!rows.length) return;
  const { error } = await db().from("admin_read_states").insert(rows);
  throwIfError(error);
}
