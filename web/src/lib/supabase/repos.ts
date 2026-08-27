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

function errorMessage(error: { message?: string; code?: string } | null): string {
  return (error?.message ?? "").toLowerCase();
}

function isMissingColumnError(error: { message?: string; code?: string } | null, column: string): boolean {
  if (!error) return false;
  const message = errorMessage(error);
  const col = column.toLowerCase();
  const mentionsColumn = message.includes(`'${col}'`) || message.includes(`"${col}"`) || message.includes(col);
  return (
    mentionsColumn &&
    (error.code === "PGRST204" ||
      message.includes("schema cache") ||
      message.includes("could not find") ||
      message.includes("does not exist"))
  );
}

function isNotNullViolation(error: { message?: string; code?: string } | null, column: string): boolean {
  if (!error) return false;
  return error.code === "23502" && errorMessage(error).includes(column.toLowerCase());
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
  const { error } = await db().from("accounts").upsert(rows, { onConflict: "id" });
  throwIfError(error);
}

function ignoreMissingTable(error: { message: string; code?: string } | null): void {
  if (!error) return;
  if (error.code === "42P01" || error.code === "42703" || error.code === "23505") return;
  throwIfError(error);
}

async function retargetSurveyAssignmentIds(
  oldEmail: string,
  newEmail: string,
  newPanelistId?: string
): Promise<void> {
  const from = normalizePanelistEmail(oldEmail);
  const to = normalizePanelistEmail(newEmail);
  const { data, error } = await db().from("survey_assignments").select("*").eq("panelist_email", from);
  throwIfError(error);

  for (const existing of data ?? []) {
    const campaignId = cleanText(String(existing.campaign_id));
    const nextId = resolveDbAssignmentId(campaignId, to);
    const currentId = String(existing.id);
    const identityPatch = {
      panelist_email: to,
      ...(newPanelistId ? { panelist_id: newPanelistId } : {}),
    };

    if (currentId === nextId) {
      const { error: updateError } = await db().from("survey_assignments").update(identityPatch).eq("id", currentId);
      throwIfError(updateError);
      continue;
    }

    const nextRow = { ...(existing as Record<string, unknown>), id: nextId, ...identityPatch };
    const { error: insertError } = await db().from("survey_assignments").insert(nextRow);
    if (insertError && insertError.code !== "23505") throwIfError(insertError);

    const { error: responseError } = await db()
      .from("survey_responses")
      .update({ assignment_id: nextId, panelist_email: to })
      .eq("assignment_id", currentId);
    ignoreMissingTable(responseError);

    await db()
      .from("point_transactions")
      .update({ reference_id: nextId })
      .eq("reference_type", "survey_assignment")
      .eq("reference_id", currentId);

    const { error: deleteError } = await db().from("survey_assignments").delete().eq("id", currentId);
    throwIfError(deleteError);
  }
}

export async function supabaseRetargetPanelistEmail(oldEmail: string, newEmail: string): Promise<boolean> {
  const from = normalizePanelistEmail(oldEmail);
  const to = normalizePanelistEmail(newEmail);
  if (!from || !to || from === to) return false;

  const { data: panelist, error: panelistError } = await db().from("panelists").select("*").eq("email", from).maybeSingle();
  throwIfError(panelistError);
  if (!panelist) return false;

  const { data: existingTarget, error: targetError } = await db()
    .from("panelists")
    .select("id")
    .eq("email", to)
    .maybeSingle();
  throwIfError(targetError);
  if (existingTarget && String(existingTarget.id) !== String(panelist.id)) {
    throw new Error("The new email is already used by another panelist.");
  }

  const { error: directError } = await db().from("panelists").update({ email: to }).eq("id", panelist.id);
  if (!directError) {
    await retargetSurveyAssignmentIds(from, to, String(panelist.id));
    return true;
  }

  const accountId = panelist.account_id ?? null;
  const oldId = String(panelist.id);

  const { error: unlinkError } = await db().from("panelists").update({ account_id: null }).eq("id", oldId);
  throwIfError(unlinkError);

  const insertPayload = panelistRecordToRow(panelistRowToRecord(panelist as Record<string, unknown>));
  delete insertPayload.id;
  insertPayload.email = to;
  insertPayload.account_id = accountId;

  const { data: inserted, error: insertError } = await db().from("panelists").insert(insertPayload).select("id").single();
  throwIfError(insertError);
  const newId = String(inserted?.id ?? "");
  if (!newId) throw new Error("Could not create the updated panelist record.");

  await retargetSurveyAssignmentIds(from, to, newId);

  const emailTables = [
    "survey_responses",
    "panelist_notification_reads",
    "panelist_reward_balance_seeds",
    "panelist_points_overrides",
  ] as const;
  for (const table of emailTables) {
    const { error } = await db().from(table).update({ panelist_email: to }).eq("panelist_email", from);
    ignoreMissingTable(error);
  }

  ignoreMissingTable(
    (await db().from("redemption_requests").update({ panelist_id: newId, panelist_email: to }).eq("panelist_id", oldId)).error
  );
  ignoreMissingTable((await db().from("point_transactions").update({ panelist_id: newId }).eq("panelist_id", oldId)).error);
  ignoreMissingTable((await db().from("panelist_uploads").update({ panelist_id: newId }).eq("panelist_id", oldId)).error);
  ignoreMissingTable(
    (await db().from("support_messages").update({ panelist_id: newId, panelist_email: to }).eq("panelist_id", oldId)).error
  );

  const { error: deleteError } = await db().from("panelists").delete().eq("id", oldId);
  throwIfError(deleteError);
  return true;
}

export async function supabaseListPanelists(): Promise<PanelistRow[]> {
  const { data, error } = await db().from("panelists").select("*");
  throwIfError(error);
  return (data ?? []).map((row) => panelistRowToRecord(row as Record<string, unknown>));
}

export async function supabaseDeleteAccountById(id: string): Promise<void> {
  const { error } = await db().from("accounts").delete().eq("id", id);
  throwIfError(error);
}

export async function supabaseDeleteAccountByEmail(email: string): Promise<void> {
  const { error } = await db().from("accounts").delete().eq("email", normalizePanelistEmail(email));
  throwIfError(error);
}

export async function supabaseDeletePanelistByEmail(email: string): Promise<boolean> {
  const { data, error } = await db()
    .from("panelists")
    .delete()
    .eq("email", normalizePanelistEmail(email))
    .select("id");
  throwIfError(error);
  return (data?.length ?? 0) > 0;
}

export async function supabaseDeletePanelistStorage(accountId: string): Promise<void> {
  const folder = cleanText(accountId);
  if (!folder) return;
  const { data, error } = await db().storage.from("panelist-documents").list(folder);
  if (error || !data?.length) return;
  await db()
    .storage.from("panelist-documents")
    .remove(data.map((file) => `${folder}/${file.name}`));
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

export async function supabaseUploadPanelistFile(
  accountId: string,
  kind: "photo_id" | "residence_proof",
  file: File
): Promise<string> {
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".bin";
  const storagePath = `${accountId}/${kind}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await db()
    .storage.from("panelist-documents")
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  throwIfError(error);
  return storagePath;
}

export async function supabaseInsertPanelist(
  row: PanelistRow,
  accountId?: string,
  options?: { photoIdPath?: string; residenceProofPath?: string }
): Promise<void> {
  const payload = {
    ...panelistRecordToRow(row),
    ...(accountId ? { account_id: accountId } : {}),
    ...(options?.photoIdPath ? { photo_id_path: options.photoIdPath } : {}),
    ...(options?.residenceProofPath ? { residence_proof_path: options.residenceProofPath } : {}),
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

export async function supabaseLoadSurveyAssignmentsForEmail(email: string): Promise<PanelistSurveyRecord[]> {
  const { data, error } = await db()
    .from("survey_assignments")
    .select("*")
    .eq("panelist_email", normalizePanelistEmail(email));
  throwIfError(error);
  return (data ?? []).map((row) => assignmentRowToRecord(row as Record<string, unknown>));
}

export async function supabaseAssignmentExistsForCampaign(campaignId: string): Promise<boolean> {
  const { data, error } = await db()
    .from("survey_assignments")
    .select("id")
    .eq("campaign_id", campaignId)
    .limit(1)
    .maybeSingle();
  throwIfError(error);
  return Boolean(data);
}

async function lookupDbAssignmentId(campaignId: string, email: string): Promise<string> {
  const normalized = normalizePanelistEmail(email);
  const { data, error } = await db()
    .from("survey_assignments")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("panelist_email", normalized)
    .maybeSingle();
  throwIfError(error);
  return data?.id ? String(data.id) : resolveDbAssignmentId(campaignId, normalized);
}

function assignmentRecordToRow(record: PanelistSurveyRecord): Record<string, unknown> {
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
    progress_percent: Math.min(100, Math.max(0, Math.round(record.progressPercent ?? 0))),
    completed_date: record.completedDate || null,
    updated_at: new Date().toISOString(),
  };
}

export async function supabaseSaveSurveyAssignments(records: PanelistSurveyRecord[]): Promise<void> {
  if (!records.length) return;
  const { error } = await db()
    .from("survey_assignments")
    .upsert(records.map(assignmentRecordToRow), {
      onConflict: "campaign_id,panelist_email",
      ignoreDuplicates: true,
    });
  throwIfError(error);
}

/** Insert only missing assignments so existing progress/completions are never overwritten. */
export async function supabaseInsertNewSurveyAssignments(records: PanelistSurveyRecord[]): Promise<void> {
  if (!records.length) return;
  const { error } = await db()
    .from("survey_assignments")
    .upsert(records.map(assignmentRecordToRow), {
      onConflict: "campaign_id,panelist_email",
      ignoreDuplicates: true,
    });
  throwIfError(error);
}

export async function supabaseUpdateSurveyAssignmentProgress(
  campaignId: string,
  panelistEmail: string,
  patch: {
    progressPercent: number;
    status: PanelistSurveyRecord["status"];
    completedDate: string | null;
  }
): Promise<void> {
  const email = normalizePanelistEmail(panelistEmail);
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    progress_percent: Math.min(100, Math.max(0, Math.round(patch.progressPercent))),
    status: patch.status,
    completed_date: patch.completedDate || null,
    updated_at: now,
  };

  let query = db()
    .from("survey_assignments")
    .update(payload)
    .eq("campaign_id", campaignId)
    .eq("panelist_email", email);
  if (patch.status !== "completed") {
    query = query.neq("status", "completed");
  }
  const { error } = await query;
  if (
    error &&
    (isMissingColumnError(error, "progress_percent") || isMissingColumnError(error, "completed_date"))
  ) {
    let fallback = db()
      .from("survey_assignments")
      .update({ status: patch.status, updated_at: now })
      .eq("campaign_id", campaignId)
      .eq("panelist_email", email);
    if (patch.status !== "completed") {
      fallback = fallback.neq("status", "completed");
    }
    const { error: fallbackError } = await fallback;
    throwIfError(fallbackError);
    return;
  }
  throwIfError(error);
}

export async function supabaseLoadSurveyResponse(
  campaignId: string,
  panelistEmail: string
): Promise<SurveyResponseRecord | null> {
  const email = normalizePanelistEmail(panelistEmail);
  const assignmentId = await lookupDbAssignmentId(campaignId, email);
  const { data, error } = await db()
    .from("survey_responses")
    .select("*")
    .eq("assignment_id", assignmentId)
    .maybeSingle();
  throwIfError(error);
  return data ? surveyResponseRowToRecord(data as Record<string, unknown>) : null;
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

export async function supabaseLoadSurveyResponsesForEmail(email: string): Promise<SurveyResponseRecord[]> {
  const { data, error } = await db()
    .from("survey_responses")
    .select("*")
    .eq("panelist_email", normalizePanelistEmail(email));
  throwIfError(error);
  return (data ?? []).map((row) => surveyResponseRowToRecord(row as Record<string, unknown>));
}

export async function supabaseUpsertSurveyResponse(response: SurveyResponseRecord): Promise<void> {
  const email = normalizePanelistEmail(response.panelistEmail);
  const assignmentId = await lookupDbAssignmentId(response.assignmentId, email);
  const payload: Record<string, unknown> = {
    assignment_id: assignmentId,
    panelist_email: email,
    survey_definition_id: response.surveyDefinitionId || null,
    answers: response.answers,
    started_at: response.startedAt || null,
    updated_at: response.updatedAt || new Date().toISOString(),
    submitted_at: response.submittedAt || null,
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await db().from("survey_responses").upsert(payload, { onConflict: "assignment_id" });
    if (!error) return;

    if (isMissingColumnError(error, "started_at") && "started_at" in payload) {
      delete payload.started_at;
      continue;
    }
    if (isMissingColumnError(error, "updated_at") && "updated_at" in payload) {
      delete payload.updated_at;
      continue;
    }
    if (
      (isNotNullViolation(error, "submitted_at") ||
        (errorMessage(error).includes("submitted_at") && payload.submitted_at == null)) &&
      "submitted_at" in payload
    ) {
      if (response.submittedAt) {
        payload.submitted_at = response.submittedAt;
      } else {
        delete payload.submitted_at;
      }
      continue;
    }
    throwIfError(error);
  }
  throw new Error("Could not save survey responses.");
}

export async function supabaseRecordSurveyCompletionPoints(input: {
  panelistEmail: string;
  campaignId: string;
  points: number;
  title: string;
}): Promise<void> {
  if (input.points <= 0) return;
  const email = normalizePanelistEmail(input.panelistEmail);
  const referenceId = await lookupDbAssignmentId(input.campaignId, email);

  const { data: existing, error: existingError } = await db()
    .from("point_transactions")
    .select("id")
    .eq("reference_type", "survey_assignment")
    .eq("reference_id", referenceId)
    .eq("kind", "survey_completion")
    .maybeSingle();
  throwIfError(existingError);
  if (existing) return;

  const { data: panelist, error: panelistError } = await db()
    .from("panelists")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  throwIfError(panelistError);
  if (!panelist?.id) return;

  const { error } = await db().from("point_transactions").insert({
    panelist_id: panelist.id,
    kind: "survey_completion",
    points: input.points,
    reference_type: "survey_assignment",
    reference_id: referenceId,
    description: `Completed survey: ${input.title}`,
  });
  if (error?.code === "23505") return;
  throwIfError(error);
}

export async function supabaseSumSurveyCompletionPoints(email: string): Promise<number> {
  const normalized = normalizePanelistEmail(email);
  const { data: panelist, error: panelistError } = await db()
    .from("panelists")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  throwIfError(panelistError);
  if (!panelist?.id) return 0;

  const { data, error } = await db()
    .from("point_transactions")
    .select("points")
    .eq("panelist_id", panelist.id)
    .eq("kind", "survey_completion");
  throwIfError(error);
  return (data ?? []).reduce((sum, row) => sum + (Number(row.points) || 0), 0);
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
    cover_image_path: campaign.coverImageFile ?? "",
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
