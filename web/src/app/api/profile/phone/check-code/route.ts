import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, resolveRequestOrigin } from "@/lib/auth";
import { findPanelistByEmail } from "@/lib/panelists";
import {
  assertCanCheckPhoneCode,
  recordPhoneCodeCheck,
} from "@/lib/phone-verify-rate-limit";
import { markPanelistPhoneVerifiedByTwilio } from "@/lib/phone-verify-service";
import {
  checkTwilioVerification,
  isTwilioVerifyEnabled,
  storedPhoneToE164,
  type TwilioVerifyChannel,
} from "@/lib/twilio-verify";
import { cleanText } from "@/lib/validation";
import { logServerError } from "@/lib/safe-log";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session?.panelistRegistered) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!isTwilioVerifyEnabled()) {
      return NextResponse.json(
        { ok: false, message: "Phone verification by code is not enabled yet." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      code?: string;
      channel?: TwilioVerifyChannel;
    };
    const code = cleanText(body.code);
    if (!/^\d{4,10}$/.test(code)) {
      return NextResponse.json({ ok: false, message: "Enter the code from the message." }, { status: 400 });
    }

    const panelist = await findPanelistByEmail(session.email, session.id);
    const phone = cleanText(panelist?.phone_whatsapp ?? "");
    const e164 = storedPhoneToE164(phone);
    if (!e164) {
      return NextResponse.json({ ok: false, message: "Phone number is missing or invalid." }, { status: 400 });
    }

    const rateKey = `verify:${session.id}`;
    try {
      assertCanCheckPhoneCode(rateKey);
    } catch (error) {
      return NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Too many attempts." },
        { status: 429 }
      );
    }

    recordPhoneCodeCheck(rateKey);
    const check = await checkTwilioVerification({ e164, code });
    if (!check.valid) {
      return NextResponse.json(
        { ok: false, message: "That code is incorrect or expired. Request a new one." },
        { status: 400 }
      );
    }

    const channel: TwilioVerifyChannel = body.channel === "sms" ? "sms" : "whatsapp";
    const result = await markPanelistPhoneVerifiedByTwilio({
      email: session.email,
      channel,
      origin: resolveRequestOrigin(request),
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      verificationStatus: result.verificationStatus,
      message: "Your phone number is verified.",
    });
  } catch (error) {
    logServerError("phone check-code failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not verify that code.",
      },
      { status: 500 }
    );
  }
}
