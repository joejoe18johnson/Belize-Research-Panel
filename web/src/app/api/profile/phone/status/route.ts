import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { findPanelistByEmail } from "@/lib/panelists";
import { readAdminRequirementDecision } from "@/lib/panelist-requirements";
import { isTwilioVerifyEnabled } from "@/lib/twilio-verify";
import { cleanText } from "@/lib/validation";

export async function GET() {
  const session = await getSessionAccount();
  if (!session?.panelistRegistered) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const panelist = await findPanelistByEmail(session.email, session.id);
  const phone = cleanText(panelist?.phone_whatsapp ?? "");
  const approved = panelist ? readAdminRequirementDecision(panelist, "phone") === "true" : false;
  const via = cleanText(panelist?.phone_verified_via ?? "");

  return NextResponse.json({
    ok: true,
    twilioEnabled: isTwilioVerifyEnabled(),
    phone,
    approved,
    phoneVerifiedVia: via || null,
  });
}
