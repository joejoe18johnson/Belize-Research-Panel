import { NextResponse } from "next/server";
import { deletePanelistByEmail } from "@/lib/admin-panelist-actions";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { updatePanelistAdminFields } from "@/lib/panelists";
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
