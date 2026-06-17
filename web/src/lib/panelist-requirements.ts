import type { AccountRecord } from "./auth-types";
import type { PanelistRow } from "./panelists";
import { isPanelistVerified } from "./verification-status";
import { cleanText, validEmail } from "./validation";

export type RequirementKey = "email" | "phone" | "photo_id";
export type RequirementApprovalStatus = "approved" | "under_review" | "missing";

export interface RequirementItem {
  key: RequirementKey;
  label: string;
  status: RequirementApprovalStatus;
  detail: string;
}

export interface PanelistRequirements {
  email: RequirementApprovalStatus;
  phone: RequirementApprovalStatus;
  photoId: RequirementApprovalStatus;
  items: RequirementItem[];
  allApproved: boolean;
  hasIncomplete: boolean;
  incompleteSummary: string;
}

export interface RequirementContext {
  emailVerified?: boolean;
  pendingPhone?: boolean;
  hasPhotoUpload?: boolean;
}

function phoneDigits(value: string): string {
  return cleanText(value).replace(/\D/g, "");
}

function photoIdOnFile(panelist: PanelistRow, context: RequirementContext): boolean {
  const photoIdType = cleanText(panelist.photo_id_type);
  const authorisedRegistration = cleanText(panelist.notes).toLowerCase().includes("authorised registration");
  return Boolean(photoIdType || authorisedRegistration || context.hasPhotoUpload);
}

function assessEmail(panelist: PanelistRow, context: RequirementContext): RequirementItem {
  const email = cleanText(panelist.email).toLowerCase();
  const onFile = Boolean(email && validEmail(email));
  const accountVerified = context.emailVerified !== false;

  let status: RequirementApprovalStatus = "missing";
  if (!onFile) {
    status = "missing";
  } else if (isPanelistVerified(panelist.verification_status) && accountVerified) {
    status = "approved";
  } else {
    status = "under_review";
  }

  return {
    key: "email",
    label: "Email",
    status,
    detail: onFile ? email : "Not provided",
  };
}

function assessPhone(panelist: PanelistRow, context: RequirementContext): RequirementItem {
  const phone = cleanText(panelist.phone_whatsapp);
  const onFile = phoneDigits(phone).length === 10;
  const pendingChange = Boolean(context.pendingPhone);

  let status: RequirementApprovalStatus = "missing";
  if (!onFile) {
    status = "missing";
  } else if (isPanelistVerified(panelist.verification_status) && !pendingChange) {
    status = "approved";
  } else {
    status = "under_review";
  }

  return {
    key: "phone",
    label: "Phone",
    status,
    detail: onFile ? phone : "Not provided",
  };
}

function assessPhotoId(panelist: PanelistRow, context: RequirementContext): RequirementItem {
  const onFile = photoIdOnFile(panelist, context);
  const photoIdType = cleanText(panelist.photo_id_type);

  let status: RequirementApprovalStatus = "missing";
  if (!onFile) {
    status = "missing";
  } else if (isPanelistVerified(panelist.verification_status)) {
    status = "approved";
  } else {
    status = "under_review";
  }

  let detail = "Not provided";
  if (onFile) {
    detail = photoIdType || "Submitted — review in progress";
  }

  return {
    key: "photo_id",
    label: "Photo ID",
    status,
    detail,
  };
}

export function requirementContextFromAccount(account: AccountRecord | undefined): RequirementContext {
  if (!account) return {};
  return {
    emailVerified: account.email_verified === "true",
    pendingPhone: Boolean(cleanText(account.pending_phone_whatsapp)),
  };
}

export function assessPanelistRequirements(
  panelist: PanelistRow,
  context: RequirementContext = {}
): PanelistRequirements {
  const items = [
    assessEmail(panelist, context),
    assessPhone(panelist, context),
    assessPhotoId(panelist, context),
  ];

  const email = items[0].status;
  const phone = items[1].status;
  const photoId = items[2].status;
  const allApproved = items.every((item) => item.status === "approved");
  const hasIncomplete = items.some((item) => item.status !== "approved");

  const incompleteParts = items
    .filter((item) => item.status !== "approved")
    .map((item) => `${item.label} ${item.status === "missing" ? "missing" : "under review"}`);

  return {
    email,
    phone,
    photoId,
    items,
    allApproved,
    hasIncomplete,
    incompleteSummary: incompleteParts.join("; "),
  };
}

export function buildPanelistReviewReasons(
  panelist: PanelistRow,
  context: RequirementContext = {},
  options: { accountOnHold?: boolean } = {}
): string[] {
  const requirements = assessPanelistRequirements(panelist, context);
  const reasons: string[] = [];
  const status = cleanText(panelist.verification_status);

  if (status === "Possible Duplicate") reasons.push("Flagged as possible duplicate");
  if (status === "Needs Follow-up") reasons.push("Needs administrator follow-up");
  if (status === "Rejected") reasons.push("Registration rejected");
  if (status === "Pending") reasons.push("Verification pending");

  for (const item of requirements.items) {
    if (item.status === "missing") reasons.push(`${item.label} missing`);
    else if (item.status === "under_review") reasons.push(`${item.label} under review`);
  }

  if (options.accountOnHold) {
    reasons.push("Account on hold");
  }

  if (reasons.length === 0 && !requirements.allApproved) {
    reasons.push("Required contact and ID checks incomplete");
  }

  return [...new Set(reasons)];
}

export function panelistRequiresAdminReview(
  panelist: PanelistRow,
  context: RequirementContext = {},
  options: { accountOnHold?: boolean } = {}
): boolean {
  const requirements = assessPanelistRequirements(panelist, context);
  const status = cleanText(panelist.verification_status);

  if (options.accountOnHold) return true;
  if (!requirements.allApproved) return true;
  if (status === "Possible Duplicate" || status === "Needs Follow-up" || status === "Pending") return true;

  return false;
}

export function canApprovePanelistVerification(
  panelist: PanelistRow,
  context: RequirementContext = {}
): { ok: boolean; message: string } {
  const requirements = assessPanelistRequirements(panelist, context);
  if (requirements.allApproved) {
    return { ok: true, message: "" };
  }
  return {
    ok: false,
    message: `Cannot mark as Verified until required items are complete: ${requirements.incompleteSummary}.`,
  };
}

export function requirementStatusLabel(status: RequirementApprovalStatus): string {
  if (status === "approved") return "Approved";
  if (status === "under_review") return "Under review";
  return "Missing";
}
