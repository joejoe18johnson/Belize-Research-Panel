import { NextRequest, NextResponse } from "next/server";
import { getPendingPhoneForApproval } from "@/lib/accounts";
import { getSessionAccount, resolveRequestOrigin } from "@/lib/auth";
import {
  assertCanCheckPhoneCode,
  recordPhoneCodeCheck,
} from "@/lib/phone-verify-rate-limit";
import { applyPendingPhoneChangeViaTwilio } from "@/lib/phone-verify-service";
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
        { ok: false, message: "Automatic phone change is not enabled." },
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

    const pendingPhone = await getPendingPhoneForApproval(session.email);
    if (!pendingPhone) {
      return NextResponse.json(
        { ok: false, message: "No pending phone change. Request a new code first." },
        { status: 400 }
      );
    }

    const e164 = storedPhoneToE164(pendingPhone);
    if (!e164) {
      return NextResponse.json({ ok: false, message: "Pending phone number is invalid." }, { status: 400 });
    }

    const rateKey = `phone-change:${session.id}`;
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
    const applied = await applyPendingPhoneChangeViaTwilio({
      email: session.email,
      channel,
      origin: resolveRequestOrigin(request),
    });

    if (!applied.ok) {
      return NextResponse.json({ ok: false, message: applied.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      phone: applied.phone,
      message: "Your phone number was updated and verified.",
    });
  } catch (error) {
    logServerError("phone-change check-code failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not verify that code.",
      },
      { status: 500 }
    );
  }
}
