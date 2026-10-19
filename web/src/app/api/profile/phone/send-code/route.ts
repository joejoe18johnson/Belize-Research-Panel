import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, resolveRequestOrigin } from "@/lib/auth";
import { findPanelistByEmail } from "@/lib/panelists";
import {
  assertCanSendPhoneCode,
  recordPhoneCodeSend,
} from "@/lib/phone-verify-rate-limit";
import { isSmsPhoneOtpEnabled } from "@/lib/platform-testing-settings-store";
import {
  isTwilioVerifyEnabled,
  startTwilioVerificationExact,
  startTwilioVerificationWithFallback,
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
        {
          ok: false,
          message:
            "Phone verification by code is not enabled yet. An administrator will confirm your number.",
          twilioEnabled: false,
        },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      preferChannel?: TwilioVerifyChannel;
    };

    const panelist = await findPanelistByEmail(session.email, session.id);
    const phone = cleanText(panelist?.phone_whatsapp ?? "");
    if (!phone) {
      return NextResponse.json(
        { ok: false, message: "Add a phone number to your profile before verifying." },
        { status: 400 }
      );
    }

    const e164 = storedPhoneToE164(phone);
    if (!e164) {
      return NextResponse.json(
        { ok: false, message: "Your phone number could not be formatted for verification. Update it on your profile." },
        { status: 400 }
      );
    }

    const rateKey = `verify:${session.id}`;
    try {
      assertCanSendPhoneCode(rateKey);
    } catch (error) {
      return NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Please wait before requesting another code." },
        { status: 429 }
      );
    }

    const preferSms = body.preferChannel === "sms";
    const smsEnabled = await isSmsPhoneOtpEnabled();
    if (preferSms && !smsEnabled) {
      return NextResponse.json(
        { ok: false, message: "SMS verification is turned off. Use WhatsApp instead." },
        { status: 403 }
      );
    }

    const result = preferSms
      ? await startTwilioVerificationExact({ e164, channel: "sms" })
      : await startTwilioVerificationWithFallback({
          e164,
          preferChannel: "whatsapp",
          allowSmsFallback: smsEnabled,
        });
    recordPhoneCodeSend(rateKey);

    const channel: TwilioVerifyChannel = result.channel;
    let message =
      channel === "whatsapp"
        ? "We sent a code to WhatsApp. Enter it below."
        : "We sent a code by SMS. Enter it below.";
    if (!preferSms && result.fellBack && channel === "sms") {
      message =
        "WhatsApp delivery was unavailable, so we sent the code by SMS instead. Enter it below.";
    }

    return NextResponse.json({
      ok: true,
      channel,
      fellBack: result.fellBack,
      maskedPhone: phone,
      message,
      origin: resolveRequestOrigin(request),
    });
  } catch (error) {
    logServerError("phone send-code failed", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Could not send a verification code. Try again shortly.",
      },
      { status: 500 }
    );
  }
}
