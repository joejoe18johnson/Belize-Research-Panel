import type { AccountHoldReason, AccountRecord } from "./auth-types";
import type { AdminDataHub } from "./admin-data-hub";
import { buildDuplicateNameDobKeyCounts, duplicateNameDobKey, isDuplicateNameDobMatch, isFlaggedPanelist } from "./admin-panelists";
import type { PanelistRow } from "./panelists";
import type { RedemptionRequest } from "./reward-redemption";
import type { StoredRedemptionOptionId } from "./reward-redemption";
import type { RequirementApprovalStatus } from "./panelist-requirements";
import {
  assessPanelistRequirements,
  buildPanelistReviewReasons,
  panelistRequiresAdminReview,
  requirementContextFromAccount,
} from "./panelist-requirements";
import { requirementContextForPanelist } from "./panelist-requirement-context";
import {
  formatAdminPayoutDate,
  formatPayoutPaymentDetails,
  payoutShortId,
} from "./admin-payout-display";
import { adminNotificationId } from "./admin-read-state";
import { cleanText } from "./validation";

export interface AdminDashboardMetrics {
  total: number;
  verified: number;
  pending: number;
  flagged: number;
  needsFollowUp: number;
  rejected: number;
  duplicateWarnings: number;
  onHold: number;
  fraudReviewHold: number;
  contactChangeHold: number;
  pendingEmailChanges: number;
  pendingPhoneChanges: number;
  unverifiedAccounts: number;
  pendingPayouts: number;
  approvedPayouts: number;
  underReviewTotal: number;
  phoneNumbersToReview: number;
  idDocumentsToReview: number;
  addressDocumentsToReview: number;
  totalRedemptionRequests: number;
}

export interface RecentPanelistRow {
  email: string;
  name: string;
  panelistStatus: string;
  verificationStatus: string;
  phone: string;
  phoneApproved: boolean;
  hasIdDoc: boolean;
  hasAddressDoc: boolean;
}

export interface UnderReviewRow {
  email: string;
  name: string;
  verificationStatus: string;
  panelistStatus: string;
  holdReason: AccountHoldReason;
  accountStatus: string;
  reasons: string[];
  registrationDate: string;
  emailRequirement: RequirementApprovalStatus;
  phoneRequirement: RequirementApprovalStatus;
  photoIdRequirement: RequirementApprovalStatus;
  hasAddressDocument: boolean;
}

export interface NotificationQueueRow {
  id: string;
  email: string;
  name: string;
  type: "Email change" | "Phone change" | "Email verification";
  detail: string;
  requestedAt: string;
}

export interface PayoutQueueRow {
  id: string;
  shortId: string;
  email: string;
  optionId: StoredRedemptionOptionId;
  optionLabel: string;
  points: number;
  amountBz: number;
  status: RedemptionRequest["status"];
  submittedAt: string;
  formattedDate: string;
  updatedAt: string;
  formattedUpdatedDate: string;
  processedBy?: string;
  paymentTitle: string;
  paymentLines: string[];
  paymentFields: { label: string; value: string }[];
  panelistNotes: string;
}

function panelistName(row: PanelistRow | undefined, account?: AccountRecord): string {
  if (row) return `${cleanText(row.first_name)} ${cleanText(row.last_name)}`.trim() || "—";
  if (account) return `${cleanText(account.first_name)} ${cleanText(account.last_name)}`.trim() || "—";
  return "—";
}

function countDuplicateNameDob(rows: PanelistRow[]): number {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key.replace(/\|/g, "").trim()) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let total = 0;
  counts.forEach((count) => {
    if (count > 1) total += count;
  });
  return total;
}

export function buildAdminDashboardMetrics(hub: AdminDataHub): AdminDashboardMetrics {
  const { panelists, accounts, redemptionRequests } = hub;

  const flagged = panelists.filter(isFlaggedPanelist).length;
  const duplicateByNameDob = countDuplicateNameDob(panelists);

  const onHoldAccounts = accounts.filter((account) => cleanText(account.account_status) === "on_hold");
  const fraudReviewHold = onHoldAccounts.filter((account) => account.hold_reason === "fraud_review").length;
  const contactChangeHold = onHoldAccounts.filter(
    (account) =>
      account.hold_reason === "email_change" ||
      account.hold_reason === "phone_change" ||
      account.hold_reason === "email_and_phone"
  ).length;

  const pendingEmailChanges = accounts.filter((account) => cleanText(account.pending_email)).length;
  const pendingPhoneChanges = accounts.filter((account) => cleanText(account.pending_phone_whatsapp)).length;
  const unverifiedAccounts = accounts.filter((account) => account.email_verified !== "true").length;

  const pending = panelists.filter((row) => cleanText(row.verification_status) === "Pending").length;
  const needsFollowUp = panelists.filter((row) => cleanText(row.verification_status) === "Needs Follow-up").length;
  const rejected = panelists.filter((row) => cleanText(row.verification_status) === "Rejected").length;

  const pendingPayouts = redemptionRequests.filter((request) => request.status === "pending").length;
  const approvedPayouts = redemptionRequests.filter((request) => request.status === "approved").length;

  const underReviewTotal = hub.panelists.filter((row) => {
    const email = cleanText(row.email).toLowerCase();
    const account = hub.accounts.find((item) => cleanText(item.email).toLowerCase() === email);
    const context = requirementContextFromAccount(account);
    return panelistRequiresAdminReview(row, context, {
      accountOnHold: cleanText(account?.account_status) === "on_hold",
    });
  }).length;

  let phoneNumbersToReview = pendingPhoneChanges;
  let idDocumentsToReview = 0;
  let addressDocumentsToReview = 0;

  for (const row of hub.panelists) {
    const email = cleanText(row.email).toLowerCase();
    const account = hub.accounts.find((item) => cleanText(item.email).toLowerCase() === email);
    const context = requirementContextFromAccount(account);
    const requirements = assessPanelistRequirements(row, context);
    if (requirements.phone === "under_review") phoneNumbersToReview += 1;
    if (requirements.photoId === "under_review") idDocumentsToReview += 1;
    if (cleanText(row.place_of_residence) && requirements.photoId !== "approved") {
      addressDocumentsToReview += 1;
    }
  }

  return {
    total: panelists.length,
    verified: panelists.filter((row) => cleanText(row.verification_status) === "Verified").length,
    pending,
    flagged,
    needsFollowUp,
    rejected,
    duplicateWarnings: flagged,
    onHold: onHoldAccounts.length,
    fraudReviewHold,
    contactChangeHold,
    pendingEmailChanges,
    pendingPhoneChanges,
    unverifiedAccounts,
    pendingPayouts,
    approvedPayouts,
    underReviewTotal,
    phoneNumbersToReview,
    idDocumentsToReview,
    addressDocumentsToReview,
    totalRedemptionRequests: hub.redemptionRequests.length,
  };
}

export function buildRecentPanelistRows(
  hub: AdminDataHub,
  photoUploadUsernames: Set<string> = new Set(),
  limit = 5
): RecentPanelistRow[] {
  const accountsByEmail = new Map(
    hub.accounts.map((account) => [cleanText(account.email).toLowerCase(), account] as const)
  );

  return [...hub.panelists]
    .sort((a, b) => cleanText(b.registration_date).localeCompare(cleanText(a.registration_date)))
    .slice(0, limit)
    .map((row) => {
      const email = cleanText(row.email).toLowerCase();
      const context = requirementContextForPanelist(row, accountsByEmail, photoUploadUsernames);
      const requirements = assessPanelistRequirements(row, context);
      const username = cleanText(row.username);
      const hasIdDoc = Boolean(cleanText(row.photo_id_type) || (username && photoUploadUsernames.has(username)));
      const hasAddressDoc = Boolean(cleanText(row.place_of_residence));

      return {
        email,
        name: panelistName(row),
        panelistStatus: cleanText(row.status) || "Active",
        verificationStatus: cleanText(row.verification_status) || "Pending",
        phone: cleanText(row.phone_whatsapp) || "—",
        phoneApproved: requirements.phone === "approved",
        hasIdDoc,
        hasAddressDoc,
      };
    });
}

export function buildUnderReviewRows(
  hub: AdminDataHub,
  photoUploadUsernames: Set<string> = new Set()
): UnderReviewRow[] {
  const panelistByEmail = new Map<string, PanelistRow>();
  for (const row of hub.panelists) {
    const email = cleanText(row.email).toLowerCase();
    if (email) panelistByEmail.set(email, row);
  }

  const accountsByEmail = new Map(
    hub.accounts.map((account) => [cleanText(account.email).toLowerCase(), account] as const)
  );

  const rows = new Map<string, UnderReviewRow>();
  const duplicateKeyCounts = buildDuplicateNameDobKeyCounts(hub.panelists);

  for (const row of hub.panelists) {
    const email = cleanText(row.email).toLowerCase();
    if (!email) continue;

    const account = accountsByEmail.get(email);
    const context = requirementContextForPanelist(row, accountsByEmail, photoUploadUsernames);
    const accountOnHold = cleanText(account?.account_status) === "on_hold";
    const duplicateNameDobMatch = isDuplicateNameDobMatch(row, duplicateKeyCounts);

    if (!panelistRequiresAdminReview(row, context, { accountOnHold, duplicateNameDobMatch })) continue;

    const requirements = assessPanelistRequirements(row, context);
    const reasons = buildPanelistReviewReasons(row, context, { accountOnHold, duplicateNameDobMatch });

    rows.set(email, {
      email,
      name: panelistName(row),
      verificationStatus: cleanText(row.verification_status) || "Pending",
      panelistStatus: cleanText(row.status) || "Active",
      holdReason: (account?.hold_reason ?? "") as AccountHoldReason,
      accountStatus: accountOnHold ? "on_hold" : "active",
      reasons,
      registrationDate: cleanText(row.registration_date),
      emailRequirement: requirements.email,
      phoneRequirement: requirements.phone,
      photoIdRequirement: requirements.photoId,
      hasAddressDocument: Boolean(cleanText(row.place_of_residence)),
    });
  }

  for (const account of hub.accounts) {
    if (cleanText(account.account_status) !== "on_hold") continue;
    const email = cleanText(account.email).toLowerCase();
    if (!email || rows.has(email)) continue;

    const panelist = panelistByEmail.get(email);
    if (!panelist) {
      rows.set(email, {
        email,
        name: panelistName(undefined, account),
        verificationStatus: "—",
        panelistStatus: "—",
        holdReason: (account.hold_reason ?? "") as AccountHoldReason,
        accountStatus: "on_hold",
        reasons: ["Account on hold"],
        registrationDate: "",
        emailRequirement: "missing",
        phoneRequirement: "missing",
        photoIdRequirement: "missing",
        hasAddressDocument: false,
      });
      continue;
    }

    const context = requirementContextForPanelist(panelist, accountsByEmail, photoUploadUsernames);
    const requirements = assessPanelistRequirements(panelist, context);
    const reasons = buildPanelistReviewReasons(panelist, context, {
      accountOnHold: true,
      duplicateNameDobMatch: isDuplicateNameDobMatch(panelist, duplicateKeyCounts),
    });

    rows.set(email, {
      email,
      name: panelistName(panelist, account),
      verificationStatus: cleanText(panelist.verification_status) || "—",
      panelistStatus: cleanText(panelist.status) || "—",
      holdReason: (account.hold_reason ?? "") as AccountHoldReason,
      accountStatus: "on_hold",
      reasons,
      registrationDate: cleanText(panelist.registration_date),
      emailRequirement: requirements.email,
      phoneRequirement: requirements.phone,
      photoIdRequirement: requirements.photoId,
      hasAddressDocument: Boolean(cleanText(panelist.place_of_residence)),
    });
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildNotificationQueueRows(hub: AdminDataHub): NotificationQueueRow[] {
  const panelistByEmail = new Map<string, PanelistRow>();
  for (const row of hub.panelists) {
    const email = cleanText(row.email).toLowerCase();
    if (email) panelistByEmail.set(email, row);
  }

  const rows: NotificationQueueRow[] = [];

  for (const account of hub.accounts) {
    const email = cleanText(account.email).toLowerCase();
    if (!email) continue;
    const panelist = panelistByEmail.get(email);
    const name = panelistName(panelist, account);

    const pendingEmail = cleanText(account.pending_email);
    if (pendingEmail) {
      rows.push({
        id: adminNotificationId("Email change", email),
        email,
        name,
        type: "Email change",
        detail: `${email} → ${pendingEmail}`,
        requestedAt: cleanText(account.email_change_requested_at) || "—",
      });
    }

    const pendingPhone = cleanText(account.pending_phone_whatsapp);
    if (pendingPhone) {
      rows.push({
        id: adminNotificationId("Phone change", email),
        email,
        name,
        type: "Phone change",
        detail: pendingPhone,
        requestedAt: cleanText(account.phone_change_requested_at) || "—",
      });
    }

    if (account.email_verified !== "true") {
      rows.push({
        id: adminNotificationId("Email verification", email),
        email,
        name,
        type: "Email verification",
        detail: "Signup email not verified",
        requestedAt: cleanText(account.created_at) || "—",
      });
    }
  }

  return rows
    .sort((a, b) => {
      const aTime = parseNotificationSortTime(a.requestedAt);
      const bTime = parseNotificationSortTime(b.requestedAt);
      if (bTime !== aTime) return bTime - aTime;
      return a.name.localeCompare(b.name);
    })
    .map((row) => ({
      ...row,
      requestedAt: formatNotificationRequestedAt(row.requestedAt === "—" ? "" : row.requestedAt),
    }));
}

function formatNotificationRequestedAt(value: string): string {
  if (!value) return "—";
  const ms = Date.parse(value);
  if (!Number.isNaN(ms)) return formatAdminPayoutDate(value);
  return value;
}

function parseNotificationSortTime(requestedAt: string): number {
  const value = cleanText(requestedAt);
  if (!value || value === "—") return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

function mapRedemptionToPayoutRow(request: RedemptionRequest): PayoutQueueRow {
  const email = cleanText(request.email).toLowerCase();
  const payment = formatPayoutPaymentDetails(request.optionId, request.details);
  const processedBy = cleanText(request.processedBy);

  return {
    id: request.id,
    shortId: payoutShortId(request.id),
    email,
    optionId: request.optionId,
    optionLabel: request.optionLabel,
    points: request.points,
    amountBz: request.amountBz ?? request.points / 25,
    status: request.status,
    submittedAt: request.submittedAt,
    formattedDate: formatAdminPayoutDate(request.submittedAt),
    updatedAt: request.updatedAt,
    formattedUpdatedDate: formatAdminPayoutDate(request.updatedAt),
    ...(processedBy ? { processedBy } : {}),
    paymentTitle: payment.title,
    paymentLines: payment.lines,
    paymentFields: payment.fields,
    panelistNotes: cleanText(request.notes),
  };
}

export function buildPayoutQueueRows(hub: AdminDataHub): PayoutQueueRow[] {
  return hub.redemptionRequests
    .filter((request) => request.status === "pending" || request.status === "approved")
    .map(mapRedemptionToPayoutRow)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function buildPayoutHistoryRows(hub: AdminDataHub): PayoutQueueRow[] {
  return hub.redemptionRequests
    .filter((request) => request.status === "fulfilled" || request.status === "rejected")
    .map(mapRedemptionToPayoutRow)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function buildRecentPayoutRows(hub: AdminDataHub, limit = 8): PayoutQueueRow[] {
  return [...buildPayoutQueueRows(hub), ...buildPayoutHistoryRows(hub)]
    .sort((a, b) => {
      const aKey = a.status === "pending" || a.status === "approved" ? a.submittedAt : a.updatedAt;
      const bKey = b.status === "pending" || b.status === "approved" ? b.submittedAt : b.updatedAt;
      return bKey.localeCompare(aKey);
    })
    .slice(0, limit);
}
