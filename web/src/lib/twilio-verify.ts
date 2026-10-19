import "server-only";
import twilio from "twilio";
import { splitStoredPhoneNumber, toE164PhoneNumber } from "./phone-codes";
import { isTwilioVerifyConfigured } from "./twilio-verify-config";
import { cleanText } from "./validation";

export type TwilioVerifyChannel = "whatsapp" | "sms";

export function isTwilioVerifyEnabled(): boolean {
  return isTwilioVerifyConfigured();
}

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

function getTwilioClient() {
  const accountSid = cleanEnv(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanEnv(process.env.TWILIO_AUTH_TOKEN);
  if (!accountSid || !authToken) {
    throw new Error("Twilio is not configured.");
  }
  return twilio(accountSid, authToken);
}

function getVerifyServiceSid(): string {
  const sid = cleanEnv(process.env.TWILIO_VERIFY_SERVICE_SID);
  if (!sid) throw new Error("Twilio Verify service is not configured.");
  return sid;
}

/** Convert a stored panel phone (e.g. "+501 612-3456") to E.164 for Twilio. */
export function storedPhoneToE164(storedPhone: string): string | null {
  const raw = cleanText(storedPhone);
  if (!raw) return null;
  const digitsOnly = raw.replace(/\D/g, "");
  if (raw.startsWith("+") && digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }
  const { phoneCountryCode, phoneLocalNumber } = splitStoredPhoneNumber(raw);
  if (!phoneCountryCode || !phoneLocalNumber) return null;
  const e164 = toE164PhoneNumber(phoneCountryCode, phoneLocalNumber);
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}

export async function startTwilioVerification(input: {
  e164: string;
  channel: TwilioVerifyChannel;
}): Promise<{ sid: string; channel: TwilioVerifyChannel; status: string }> {
  if (!isTwilioVerifyEnabled()) {
    throw new Error("Twilio Verify is not enabled.");
  }
  const client = getTwilioClient();
  const verification = await client.verify.v2.services(getVerifyServiceSid()).verifications.create({
    to: input.e164,
    channel: input.channel,
  });
  return {
    sid: verification.sid,
    channel: input.channel,
    status: verification.status,
  };
}

export async function checkTwilioVerification(input: {
  e164: string;
  code: string;
}): Promise<{ status: string; valid: boolean }> {
  if (!isTwilioVerifyEnabled()) {
    throw new Error("Twilio Verify is not enabled.");
  }
  const client = getTwilioClient();
  const check = await client.verify.v2.services(getVerifyServiceSid()).verificationChecks.create({
    to: input.e164,
    code: cleanText(input.code),
  });
  return {
    status: check.status,
    valid: check.status === "approved",
  };
}

function friendlyTwilioError(error: unknown, channel: TwilioVerifyChannel): Error {
  const raw =
    error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : error instanceof Error
        ? error.message
        : "Could not send a verification code.";
  const code =
    error && typeof error === "object" && "code" in error ? Number((error as { code: unknown }).code) : NaN;

  if (/auth token is not valid|authenticate|20003/i.test(raw) || code === 20003) {
    return new Error(
      "Twilio rejected the account credentials. In Netlify, replace TWILIO_AUTH_TOKEN with the full Primary Auth Token from Twilio Console (usually 32 characters), then redeploy."
    );
  }

  if (channel === "whatsapp") {
    if (code === 63008 || /messaging service|whatsapp sender|63008/i.test(raw)) {
      return new Error(
        "WhatsApp OTP is not fully set up yet. In Twilio Console, link a WhatsApp Sender (Messaging Service MG…) to your Verify service’s WhatsApp tab, then try again."
      );
    }
    if (code === 60200 || /trial|unverified|not a valid/i.test(raw)) {
      return new Error(
        "Twilio could not send WhatsApp to this number. On a trial account, verify the recipient phone in the Twilio Console first."
      );
    }
    return new Error(raw || "Could not send a WhatsApp verification code.");
  }

  return new Error(raw || "Could not send a verification code.");
}

/**
 * Send on the requested channel only (no silent SMS/WhatsApp swap).
 * Use this when the panelist explicitly picks WhatsApp or SMS so setup errors stay visible.
 */
export async function startTwilioVerificationExact(input: {
  e164: string;
  channel: TwilioVerifyChannel;
}): Promise<{ sid: string; channel: TwilioVerifyChannel; status: string; fellBack: false }> {
  try {
    const result = await startTwilioVerification(input);
    return { ...result, fellBack: false };
  } catch (error) {
    throw friendlyTwilioError(error, input.channel);
  }
}

/** Prefer WhatsApp; if start fails and SMS is allowed, try SMS. */
export async function startTwilioVerificationWithFallback(input: {
  e164: string;
  preferChannel?: TwilioVerifyChannel;
  /** When false, WhatsApp failures are not retried as SMS. Default true for backward compatibility. */
  allowSmsFallback?: boolean;
}): Promise<{ sid: string; channel: TwilioVerifyChannel; status: string; fellBack: boolean }> {
  const preferred = input.preferChannel ?? "whatsapp";
  const allowSmsFallback = input.allowSmsFallback !== false;

  try {
    const result = await startTwilioVerification({ e164: input.e164, channel: preferred });
    return { ...result, fellBack: false };
  } catch (preferredError) {
    if (!allowSmsFallback || preferred !== "whatsapp") {
      throw friendlyTwilioError(preferredError, preferred);
    }
    try {
      const result = await startTwilioVerification({ e164: input.e164, channel: "sms" });
      return { ...result, fellBack: true };
    } catch {
      throw friendlyTwilioError(preferredError, preferred);
    }
  }
}
