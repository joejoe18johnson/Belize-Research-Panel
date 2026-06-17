import type { AccountRecord } from "./auth-types";
import { FLAGGED_VERIFICATION_STATUS } from "./admin-panelists";
import type { PanelistRow } from "./panelists";
import { isPanelistVerified } from "./verification-status";
import { cleanText, validEmail } from "./validation";

export type RequirementKey = "email" | "phone" | "photo_id";
export type RequirementApprovalStatus = "approved" | "under_review" | "missing" | "denied";

export type AdminRequirementDecision = "" | "true" | "false";

export const ADMIN_REQUIREMENT_FIELDS = {
  email: "admin_email_approved",
  phone: "admin_phone_approved",
  photoId: "admin_photo_id_approved",
} as const;

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

function readAdminDecision(panelist: PanelistRow, field: string): AdminRequirementDecision {
  const value = cleanText(panelist[field]).toLowerCase();
  if (value === "true") return "true";
  if (value === "false") return "false";
  return "";
}

function resolveRequirementStatus(
  onFile: boolean,
  adminDecision: AdminRequirementDecision,
  legacyApproved: boolean
): RequirementApprovalStatus {
  if (adminDecision === "true") return onFile ? "approved" : "missing";
  if (adminDecision === "false") return onFile ? "denied" : "missing";
  if (!onFile) return "missing";
  if (legacyApproved) return "approved";
  return "under_review";
}

function legacyEmailApproved(panelist: PanelistRow, context: RequirementContext): boolean {
  return isPanelistVerified(panelist.verification_status) && context.emailVerified !== false;
}

function legacyPhoneApproved(panelist: PanelistRow, context: RequirementContext): boolean {
  return isPanelistVerified(panelist.verification_status) && !context.pendingPhone;
}

function legacyPhotoIdApproved(panelist: PanelistRow): boolean {
  return isPanelistVerified(panelist.verification_status);
}

function assessEmail(panelist: PanelistRow, context: RequirementContext): RequirementItem {
  const email = cleanText(panelist.email).toLowerCase();
  const onFile = Boolean(email && validEmail(email));
  const status = resolveRequirementStatus(
    onFile,
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.email),
    legacyEmailApproved(panelist, context)
  );

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
  const status = resolveRequirementStatus(
    onFile,
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.phone),
    legacyPhoneApproved(panelist, context)
  );

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
  const status = resolveRequirementStatus(
    onFile,
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.photoId),
    legacyPhotoIdApproved(panelist)
  );

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

export function requirementOnFile(
  key: RequirementKey,
  panelist: PanelistRow,
  context: RequirementContext = {}
): boolean {
  if (key === "email") {
    const email = cleanText(panelist.email).toLowerCase();
    return Boolean(email && validEmail(email));
  }
  if (key === "phone") {
    return phoneDigits(cleanText(panelist.phone_whatsapp)).length === 10;
  }
  return photoIdOnFile(panelist, context);
}

export function allAdminRequirementsApproved(
  panelist: PanelistRow,
  context: RequirementContext = {}
): boolean {
  return (
    requirementOnFile("email", panelist, context) &&
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.email) === "true" &&
    requirementOnFile("phone", panelist, context) &&
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.phone) === "true" &&
    requirementOnFile("photo_id", panelist, context) &&
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.photoId) === "true"
  );
}

export function verificationStatusFromRequirementApprovals(
  panelist: PanelistRow,
  context: RequirementContext = {},
  currentStatus = cleanText(panelist.verification_status)
): string {
  if (currentStatus === "Possible Duplicate" || currentStatus === "Rejected") {
    return currentStatus;
  }
  if (allAdminRequirementsApproved(panelist, context)) {
    return "Verified";
  }
  const anyDenied =
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.email) === "false" ||
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.phone) === "false" ||
    readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS.photoId) === "false";
  if (anyDenied) {
    return currentStatus === "Needs Follow-up" ? "Needs Follow-up" : "Pending";
  }
  return currentStatus || "Pending";
}

export function readAdminRequirementDecision(
  panelist: PanelistRow,
  key: keyof typeof ADMIN_REQUIREMENT_FIELDS
): AdminRequirementDecision {
  return readAdminDecision(panelist, ADMIN_REQUIREMENT_FIELDS[key]);
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
    .map((item) => {
      if (item.status === "missing") return `${item.label} missing`;
      if (item.status === "denied") return `${item.label} denied`;
      return `${item.label} under review`;
    });

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
  options: { accountOnHold?: boolean; duplicateNameDobMatch?: boolean } = {}
): string[] {
  const requirements = assessPanelistRequirements(panelist, context);
  const reasons: string[] = [];
  const status = cleanText(panelist.verification_status);

  if (options.duplicateNameDobMatch) {
    reasons.push("Same name and date of birth as another panelist (review in Duplicate Review)");
  }
  if (status === FLAGGED_VERIFICATION_STATUS) reasons.push("Flagged as possible duplicate");
  if (status === "Needs Follow-up") reasons.push("Needs administrator follow-up");
  if (status === "Rejected") reasons.push("Registration rejected");
  if (status === "Pending") reasons.push("Verification pending");

  for (const item of requirements.items) {
    if (item.status === "missing") reasons.push(`${item.label} missing`);
    else if (item.status === "denied") reasons.push(`${item.label} denied`);
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
  options: { accountOnHold?: boolean; duplicateNameDobMatch?: boolean } = {}
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
  if (status === "denied") return "Denied";
  return "Missing";
}
