import "server-only";
import twilio from "twilio";
import { splitStoredPhoneNumber, toE164PhoneNumber } from "./phone-codes";
import { cleanText } from "./validation";

export type TwilioVerifyChannel = "whatsapp" | "sms";

export function isTwilioVerifyEnabled(): boolean {
  if (process.env.TWILIO_VERIFY_ENABLED === "false") return false;
  return Boolean(
    cleanEnv(process.env.TWILIO_ACCOUNT_SID) &&
      cleanEnv(process.env.TWILIO_AUTH_TOKEN) &&
      cleanEnv(process.env.TWILIO_VERIFY_SERVICE_SID)
  );
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

/** Prefer WhatsApp; if start fails, try SMS. */
export async function startTwilioVerificationWithFallback(input: {
  e164: string;
  preferChannel?: TwilioVerifyChannel;
}): Promise<{ sid: string; channel: TwilioVerifyChannel; status: string; fellBack: boolean }> {
  const preferred = input.preferChannel ?? "whatsapp";
  const fallback: TwilioVerifyChannel = preferred === "whatsapp" ? "sms" : "whatsapp";

  try {
    const result = await startTwilioVerification({ e164: input.e164, channel: preferred });
    return { ...result, fellBack: false };
  } catch (preferredError) {
    try {
      const result = await startTwilioVerification({ e164: input.e164, channel: fallback });
      return { ...result, fellBack: true };
    } catch {
      throw preferredError instanceof Error
        ? preferredError
        : new Error("Could not send a verification code.");
    }
  }
}
