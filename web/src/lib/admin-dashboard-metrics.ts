import type { AccountHoldReason, AccountRecord } from "./auth-types";
import type { AdminDataHub } from "./admin-data-hub";
import { duplicateNameDobKey } from "./admin-panelists";
import type { PanelistRow } from "./panelists";
import type { RedemptionRequest } from "./reward-redemption";
import type { RequirementApprovalStatus } from "./panelist-requirements";
import {
  assessPanelistRequirements,
  buildPanelistReviewReasons,
  panelistRequiresAdminReview,
  requirementContextFromAccount,
} from "./panelist-requirements";
import { requirementContextForPanelist } from "./panelist-requirement-context";
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
}

export interface UnderReviewRow {
  email: string;
  name: string;
  verificationStatus: string;
  panelistStatus: string;
  holdReason: AccountHoldReason;
  accountStatus: string;
  reason: string;
  registrationDate: string;
  emailRequirement: RequirementApprovalStatus;
  phoneRequirement: RequirementApprovalStatus;
  photoIdRequirement: RequirementApprovalStatus;
}

export interface NotificationQueueRow {
  email: string;
  name: string;
  type: "Email change" | "Phone change" | "Email verification";
  detail: string;
  requestedAt: string;
}

export interface PayoutQueueRow {
  id: string;
  email: string;
  name: string;
  optionLabel: string;
  points: number;
  amountBz: number;
  status: RedemptionRequest["status"];
  submittedAt: string;
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

  const flagged = panelists.filter((row) => cleanText(row.verification_status) === "Possible Duplicate").length;
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

  return {
    total: panelists.length,
    verified: panelists.filter((row) => cleanText(row.verification_status) === "Verified").length,
    pending,
    flagged,
    needsFollowUp,
    rejected,
    duplicateWarnings: Math.max(duplicateByNameDob, flagged),
    onHold: onHoldAccounts.length,
    fraudReviewHold,
    contactChangeHold,
    pendingEmailChanges,
    pendingPhoneChanges,
    unverifiedAccounts,
    pendingPayouts,
    approvedPayouts,
    underReviewTotal,
  };
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

  for (const row of hub.panelists) {
    const email = cleanText(row.email).toLowerCase();
    if (!email) continue;

    const account = accountsByEmail.get(email);
    const context = requirementContextForPanelist(row, accountsByEmail, photoUploadUsernames);
    const accountOnHold = cleanText(account?.account_status) === "on_hold";

    if (!panelistRequiresAdminReview(row, context, { accountOnHold })) continue;

    const requirements = assessPanelistRequirements(row, context);
    const reasons = buildPanelistReviewReasons(row, context, { accountOnHold });

    rows.set(email, {
      email,
      name: panelistName(row),
      verificationStatus: cleanText(row.verification_status) || "Pending",
      panelistStatus: cleanText(row.status) || "Active",
      holdReason: (account?.hold_reason ?? "") as AccountHoldReason,
      accountStatus: accountOnHold ? "on_hold" : "active",
      reason: reasons.join("; "),
      registrationDate: cleanText(row.registration_date),
      emailRequirement: requirements.email,
      phoneRequirement: requirements.phone,
      photoIdRequirement: requirements.photoId,
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
        reason: "Account on hold",
        registrationDate: "",
        emailRequirement: "missing",
        phoneRequirement: "missing",
        photoIdRequirement: "missing",
      });
      continue;
    }

    const context = requirementContextForPanelist(panelist, accountsByEmail, photoUploadUsernames);
    const requirements = assessPanelistRequirements(panelist, context);
    const reasons = buildPanelistReviewReasons(panelist, context, { accountOnHold: true });

    rows.set(email, {
      email,
      name: panelistName(panelist, account),
      verificationStatus: cleanText(panelist.verification_status) || "—",
      panelistStatus: cleanText(panelist.status) || "—",
      holdReason: (account.hold_reason ?? "") as AccountHoldReason,
      accountStatus: "on_hold",
      reason: reasons.join("; "),
      registrationDate: cleanText(panelist.registration_date),
      emailRequirement: requirements.email,
      phoneRequirement: requirements.phone,
      photoIdRequirement: requirements.photoId,
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
        email,
        name,
        type: "Phone change",
        detail: pendingPhone,
        requestedAt: cleanText(account.phone_change_requested_at) || "—",
      });
    }

    if (account.email_verified !== "true") {
      rows.push({
        email,
        name,
        type: "Email verification",
        detail: "Signup email not verified",
        requestedAt: cleanText(account.created_at) || "—",
      });
    }
  }

  return rows.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

export function buildPayoutQueueRows(hub: AdminDataHub): PayoutQueueRow[] {
  const panelistByEmail = new Map<string, PanelistRow>();
  for (const row of hub.panelists) {
    const email = cleanText(row.email).toLowerCase();
    if (email) panelistByEmail.set(email, row);
  }

  return hub.redemptionRequests
    .filter((request) => request.status === "pending" || request.status === "approved")
    .map((request) => {
      const email = cleanText(request.email).toLowerCase();
      const panelist = panelistByEmail.get(email);
      return {
        id: request.id,
        email,
        name: panelistName(panelist),
        optionLabel: request.optionLabel,
        points: request.points,
        amountBz: request.amountBz ?? request.points / 25,
        status: request.status,
        submittedAt: request.submittedAt,
      };
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}
