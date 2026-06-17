import { NextResponse } from "next/server";
import { deletePanelistByEmail, syncAccountHoldForVerificationStatus } from "@/lib/admin-panelist-actions";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { findAccountByEmail } from "@/lib/accounts";
import { canApprovePanelistVerification } from "@/lib/panelist-requirements";
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

  if (cleanText(body.verification_status) === "Verified") {
    const panelist = await findPanelistByEmail(accountEmail);
    if (!panelist) {
      return NextResponse.json({ ok: false, message: "Panelist record not found." }, { status: 404 });
    }

    const merged = {
      ...panelist,
      ...(body.email ? { email: cleanText(body.email).toLowerCase() } : {}),
      ...(body.phone_whatsapp !== undefined ? { phone_whatsapp: body.phone_whatsapp } : {}),
    };

    const lookupEmail = cleanText(merged.email).toLowerCase();
    const account = lookupEmail ? await findAccountByEmail(lookupEmail) : null;
    const photoUploadUsernames = await loadPanelistPhotoUploadUsernames();
    const accountsByEmail = account
      ? new Map([[lookupEmail, account]])
      : new Map<string, NonNullable<Awaited<ReturnType<typeof findAccountByEmail>>>>();
    const context = requirementContextForPanelist(merged, accountsByEmail, photoUploadUsernames);
    const approval = canApprovePanelistVerification(merged, context);
    if (!approval.ok) {
      return NextResponse.json({ ok: false, message: approval.message }, { status: 400 });
    }
  }

  const updated = await updatePanelistAdminFields(accountEmail, {
    verification_status: body.verification_status,
    status: body.status,
    email: body.email ? cleanText(body.email).toLowerCase() : undefined,
    phone_whatsapp: body.phone_whatsapp,
    district: body.district,
    city_town_village: body.city_town_village,
    constituency: body.constituency,
    notes: body.notes,
  });

  if (!updated) {
    return NextResponse.json({ ok: false, message: "Panelist record not found." }, { status: 404 });
  }

  if (body.verification_status !== undefined) {
    await syncAccountHoldForVerificationStatus(accountEmail, body.verification_status);
  }

  return NextResponse.json({ ok: true, message: "Record updated successfully." });
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
