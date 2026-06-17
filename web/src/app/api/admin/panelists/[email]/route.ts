import { NextResponse } from "next/server";
import { deletePanelistByEmail, syncAccountHoldForVerificationStatus } from "@/lib/admin-panelist-actions";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { approveAccountPhoneChange, findAccountByEmail, setAccountEmailVerifiedByAdmin } from "@/lib/accounts";
import {
  ADMIN_REQUIREMENT_FIELDS,
  allAdminRequirementsApproved,
  canApprovePanelistVerification,
  readAdminRequirementDecision,
  verificationStatusFromRequirementApprovals,
} from "@/lib/panelist-requirements";
import { loadPanelistPhotoUploadUsernames, requirementContextForPanelist } from "@/lib/panelist-requirement-context";
import { findPanelistByEmail, updatePanelistAdminFields } from "@/lib/panelists";
import { cleanText, validEmail } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ email: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { email } = await context.params;
  const accountEmail = decodeURIComponent(email);
  const body = (await request.json()) as {
    verification_status?: string;
    status?: string;
    email?: string;
    phone_whatsapp?: string;
    district?: string;
    city_town_village?: string;
    constituency?: string;
    notes?: string;
    admin_email_approved?: string;
    admin_phone_approved?: string;
    admin_photo_id_approved?: string;
  };

  const errors: string[] = [];
  if (body.email && !validEmail(body.email)) {
    errors.push("Please enter a valid email address.");
  }
  if (body.phone_whatsapp) {
    const digits = body.phone_whatsapp.replace(/\D/g, "");
    if (digits.length !== 10) {
      errors.push("Phone / WhatsApp number must contain exactly 10 digits.");
    }
  }
  if (errors.length > 0) {
    return NextResponse.json({ ok: false, message: errors.join(" ") }, { status: 400 });
  }

  const panelist = await findPanelistByEmail(accountEmail);
  if (!panelist) {
    return NextResponse.json({ ok: false, message: "Panelist record not found." }, { status: 404 });
  }

  const merged = {
    ...panelist,
    ...(body.email ? { email: cleanText(body.email).toLowerCase() } : {}),
    ...(body.phone_whatsapp !== undefined ? { phone_whatsapp: body.phone_whatsapp } : {}),
    ...(body.district !== undefined ? { district: body.district } : {}),
    ...(body.city_town_village !== undefined ? { city_town_village: body.city_town_village } : {}),
    ...(body.constituency !== undefined ? { constituency: body.constituency } : {}),
    ...(body.notes !== undefined ? { notes: body.notes } : {}),
    ...(body.admin_email_approved !== undefined
      ? { [ADMIN_REQUIREMENT_FIELDS.email]: cleanText(body.admin_email_approved) }
      : {}),
    ...(body.admin_phone_approved !== undefined
      ? { [ADMIN_REQUIREMENT_FIELDS.phone]: cleanText(body.admin_phone_approved) }
      : {}),
    ...(body.admin_photo_id_approved !== undefined
      ? { [ADMIN_REQUIREMENT_FIELDS.photoId]: cleanText(body.admin_photo_id_approved) }
      : {}),
  };

  const lookupEmail = cleanText(merged.email).toLowerCase();
  const account = lookupEmail ? await findAccountByEmail(lookupEmail) : null;
  const photoUploadUsernames = await loadPanelistPhotoUploadUsernames();
  const accountsByEmail = account
    ? new Map([[lookupEmail, account]])
    : new Map<string, NonNullable<Awaited<ReturnType<typeof findAccountByEmail>>>>();
  const requirementContext = requirementContextForPanelist(merged, accountsByEmail, photoUploadUsernames);

  let verificationStatus =
    body.verification_status !== undefined
      ? cleanText(body.verification_status)
      : verificationStatusFromRequirementApprovals(merged, requirementContext);

  if (allAdminRequirementsApproved(merged, requirementContext)) {
    verificationStatus = "Verified";
  } else if (cleanText(verificationStatus) === "Verified") {
    const approval = canApprovePanelistVerification(merged, requirementContext);
    if (!approval.ok) {
      return NextResponse.json({ ok: false, message: approval.message }, { status: 400 });
    }
  }

  const updated = await updatePanelistAdminFields(accountEmail, {
    verification_status: verificationStatus,
    status: body.status,
    email: body.email ? cleanText(body.email).toLowerCase() : undefined,
    phone_whatsapp: body.phone_whatsapp,
    district: body.district,
    city_town_village: body.city_town_village,
    constituency: body.constituency,
    notes: body.notes,
    admin_email_approved: body.admin_email_approved,
    admin_phone_approved: body.admin_phone_approved,
    admin_photo_id_approved: body.admin_photo_id_approved,
  });

  if (!updated) {
    return NextResponse.json({ ok: false, message: "Panelist record not found." }, { status: 404 });
  }

  if (readAdminRequirementDecision(merged, "email") === "true" && lookupEmail) {
    await setAccountEmailVerifiedByAdmin(lookupEmail, true);
  }

  if (readAdminRequirementDecision(merged, "phone") === "true" && lookupEmail) {
    await approveAccountPhoneChange(lookupEmail);
  }

  await syncAccountHoldForVerificationStatus(accountEmail, verificationStatus);

  const fullyVerified = verificationStatus === "Verified";
  return NextResponse.json({
    ok: true,
    message: fullyVerified
      ? "Record updated. Email, phone, and ID are verified — panelist is now fully verified."
      : "Record updated successfully.",
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ email: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { email } = await context.params;
  const accountEmail = decodeURIComponent(email);
  const deleted = await deletePanelistByEmail(accountEmail);

  if (!deleted) {
    return NextResponse.json({ ok: false, message: "Panelist record not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: "Panelist record deleted." });
}
