import { NextRequest, NextResponse } from "next/server";
import { getPendingPhoneForApproval } from "@/lib/accounts";
import { getSessionAccount } from "@/lib/auth";
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

    const body = (await request.json().catch(() => ({}))) as {
      preferChannel?: TwilioVerifyChannel;
    };

    const pendingPhone = await getPendingPhoneForApproval(session.email);
    if (!pendingPhone) {
      return NextResponse.json(
        { ok: false, message: "No pending phone change. Start a new phone change from your profile." },
        { status: 400 }
      );
    }

    const e164 = storedPhoneToE164(pendingPhone);
    if (!e164) {
      return NextResponse.json({ ok: false, message: "Pending phone number is invalid." }, { status: 400 });
    }

    const rateKey = `phone-change:${session.id}`;
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
        ? "We sent a new WhatsApp code to your pending number."
        : "We sent a new SMS code to your pending number.";
    if (!preferSms && result.fellBack && channel === "sms") {
      message =
        "WhatsApp delivery was unavailable, so we sent a new SMS code to your pending number.";
    }

    return NextResponse.json({
      ok: true,
      channel,
      fellBack: result.fellBack,
      pendingPhone,
      message,
    });
  } catch (error) {
    logServerError("phone-change resend-code failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not send a verification code.",
      },
      { status: 500 }
    );
  }
}
