import { headers } from "next/headers";
import { resolveRequestOrigin } from "./auth";
import { sendRequirementVerifiedEmail } from "./email/process-emails";
import { loadNotificationReadState, setNotificationRead } from "./notification-state";
import type { PanelistRow } from "./panelists";
import {
  assessPanelistRequirements,
  type RequirementContext,
} from "./panelist-requirements";
import type { VerificationRequirementNotices } from "./panelist-dashboard";
import { cleanText } from "./validation";

const PHONE_VERIFIED_EMAIL_MARKER = "__sent:verification-phone";
const PHOTO_VERIFIED_EMAIL_MARKER = "__sent:verification-photo-id";

function rememberRequirementEmail(result: { sent: boolean; logged: boolean; error?: string }): boolean {
  if (result.sent || result.error === "unsubscribed") return true;
  return result.logged && result.error === "RESEND_API_KEY is not configured.";
}

async function announceRequirement(input: {
  to: string;
  firstName: string;
  origin: string;
  itemLabel: string;
  detail: string;
  marker: string;
}): Promise<boolean> {
  const result = await sendRequirementVerifiedEmail({
    to: input.to,
    firstName: input.firstName,
    itemLabel: input.itemLabel,
    detail: input.detail,
    origin: input.origin,
  });
  if (!rememberRequirementEmail(result)) return false;
  await setNotificationRead(input.to, input.marker, true);
  return true;
}

export async function markRequirementVerifiedEmailsSent(email: string): Promise<void> {
  await setNotificationRead(email, PHONE_VERIFIED_EMAIL_MARKER, true);
  await setNotificationRead(email, PHOTO_VERIFIED_EMAIL_MARKER, true);
}

export function requirementNoticesForPanelist(
  panelist: PanelistRow,
  context: RequirementContext = {}
): VerificationRequirementNotices {
  const requirements = assessPanelistRequirements(panelist, {
    ...context,
    hasPhotoUpload:
      context.hasPhotoUpload ||
      Boolean(cleanText(panelist.photo_id_path) || cleanText(panelist.photo_id_type)),
  });
  const phone = requirements.items.find((item) => item.key === "phone");
  const photo = requirements.items.find((item) => item.key === "photo_id");

  return {
    phone: phone?.status ?? "under_review",
    photoId: photo?.status ?? "under_review",
    phoneDetail: phone?.detail ?? "",
    photoDetail: photo?.detail ?? "",
    photoDenialReason: cleanText(panelist.photo_id_denial_reason),
  };
}

async function originFromHeaders(): Promise<string> {
  const headerStore = await headers();
  return resolveRequestOrigin({ headers: headerStore });
}

export async function emailNewlyVerifiedRequirements(input: {
  to: string;
  firstName: string;
  origin: string;
  before: PanelistRow;
  after: PanelistRow;
  context?: RequirementContext;
}): Promise<string[]> {
  const before = requirementNoticesForPanelist(input.before, input.context);
  const after = requirementNoticesForPanelist(input.after, input.context);
  const notes: string[] = [];

  if (before.phone !== "approved" && after.phone === "approved") {
    const announced = await announceRequirement({
      to: input.to,
      firstName: input.firstName,
      origin: input.origin,
      itemLabel: "phone number",
      detail: after.phoneDetail,
      marker: PHONE_VERIFIED_EMAIL_MARKER,
    });
    if (announced) {
      notes.push("Phone number verified. The panelist was notified by email and in their alerts.");
    }
  }

  if (before.photoId !== "approved" && after.photoId === "approved") {
    const announced = await announceRequirement({
      to: input.to,
      firstName: input.firstName,
      origin: input.origin,
      itemLabel: "photo identification",
      detail: after.photoDetail,
      marker: PHOTO_VERIFIED_EMAIL_MARKER,
    });
    if (announced) {
      notes.push("Photo identification verified. The panelist was notified by email and in their alerts.");
    }
  }

  return notes;
}

/** Email a panelist once for a check that is already verified but was never announced. */
export async function emailApprovedRequirementsIfUnsent(input: {
  to: string;
  firstName: string;
  panelist: PanelistRow;
  context?: RequirementContext;
}): Promise<void> {
  const notices = requirementNoticesForPanelist(input.panelist, input.context);
  const readState = await loadNotificationReadState(input.to);
  const origin = await originFromHeaders();

  if (notices.phone === "approved" && !readState[PHONE_VERIFIED_EMAIL_MARKER]) {
    await announceRequirement({
      to: input.to,
      firstName: input.firstName,
      origin,
      itemLabel: "phone number",
      detail: notices.phoneDetail,
      marker: PHONE_VERIFIED_EMAIL_MARKER,
    });
  }

  if (notices.photoId === "approved" && !readState[PHOTO_VERIFIED_EMAIL_MARKER]) {
    await announceRequirement({
      to: input.to,
      firstName: input.firstName,
      origin,
      itemLabel: "photo identification",
      detail: notices.photoDetail,
      marker: PHOTO_VERIFIED_EMAIL_MARKER,
    });
  }
}
