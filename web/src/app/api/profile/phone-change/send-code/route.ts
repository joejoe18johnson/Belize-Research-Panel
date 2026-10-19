import { NextRequest, NextResponse } from "next/server";
import { requestAccountPhoneChangeViaOtp } from "@/lib/accounts";
import { getSessionAccount } from "@/lib/auth";
import {
  assertCanSendPhoneCode,
  recordPhoneCodeSend,
} from "@/lib/phone-verify-rate-limit";
import {
  isTwilioVerifyEnabled,
  startTwilioVerificationExact,
  startTwilioVerificationWithFallback,
  storedPhoneToE164,
  type TwilioVerifyChannel,
} from "@/lib/twilio-verify";
import { composePhoneNumber, cleanText } from "@/lib/validation";
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
          message: "Automatic phone change is not enabled. Use the admin-approval request instead.",
          twilioEnabled: false,
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      phoneCountryCode?: string;
      phoneLocalNumber?: string;
      preferChannel?: TwilioVerifyChannel;
    };

    let account;
    try {
      account = await requestAccountPhoneChangeViaOtp(
        session.id,
        String(body.phoneCountryCode ?? "+501"),
        String(body.phoneLocalNumber ?? "")
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "invalid_phone") {
          return NextResponse.json(
            { ok: false, errors: { phoneLocalNumber: "Please enter a valid phone number." } },
            { status: 400 }
          );
        }
        if (error.message === "phone_exists") {
          return NextResponse.json(
            {
              ok: false,
              errors: { phoneLocalNumber: "That phone number is already registered on the panel." },
            },
            { status: 409 }
          );
        }
      }
      throw error;
    }

    const pendingPhone = cleanText(account.pending_phone_whatsapp ?? "");
    const e164 =
      storedPhoneToE164(pendingPhone) ||
      storedPhoneToE164(
        composePhoneNumber(String(body.phoneCountryCode ?? "+501"), String(body.phoneLocalNumber ?? ""))
      );
    if (!e164) {
      return NextResponse.json(
        { ok: false, message: "Could not format that phone number for verification." },
        { status: 400 }
      );
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

    // WhatsApp primary + SMS fallback. Explicit SMS stays SMS-only.
    const preferSms = body.preferChannel === "sms";
    const result = preferSms
      ? await startTwilioVerificationExact({ e164, channel: "sms" })
      : await startTwilioVerificationWithFallback({ e164, preferChannel: "whatsapp" });
    recordPhoneCodeSend(rateKey);

    const channel: TwilioVerifyChannel = result.channel;
    let message =
      channel === "whatsapp"
        ? "We sent a code to WhatsApp on your new number. Enter it to finish the change."
        : "We sent a code by SMS to your new number. Enter it to finish the change.";
    if (!preferSms && result.fellBack && channel === "sms") {
      message =
        "WhatsApp delivery was unavailable, so we sent the code by SMS to your new number. Enter it to finish the change.";
    }

    return NextResponse.json({
      ok: true,
      needsOtp: true,
      channel,
      fellBack: result.fellBack,
      pendingPhone,
      message,
    });
  } catch (error) {
    logServerError("phone-change send-code failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not send a verification code.",
      },
      { status: 500 }
    );
  }
}
