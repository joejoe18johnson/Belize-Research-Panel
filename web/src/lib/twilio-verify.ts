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

function twilioErrorParts(error: unknown): { raw: string; code: number } {
  const raw =
    error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : error instanceof Error
        ? error.message
        : "Could not send a verification code.";
  const code =
    error && typeof error === "object" && "code" in error ? Number((error as { code: unknown }).code) : NaN;
  return { raw, code };
}

function friendlyTwilioError(error: unknown, channel: TwilioVerifyChannel): Error {
  const { raw, code } = twilioErrorParts(error);
  const withCode = Number.isFinite(code) ? ` (Twilio ${code})` : "";

  if (code === 20003 || /auth token is not valid|authenticate/i.test(raw)) {
    return new Error(
      "Twilio rejected the account credentials. In Netlify, replace TWILIO_AUTH_TOKEN with the full Primary Auth Token from Twilio Console, then redeploy."
    );
  }

  if (
    code === 21608 ||
    /Primary Compliance Profile|verified caller ids|unverified numbers/i.test(raw)
  ) {
    return new Error(
      `Twilio will not message this number until compliance is approved${withCode}. Either add +501… under Phone Numbers → Verified Caller IDs (quick test), or complete Trust Hub → Primary Customer Profile / Primary Compliance Profile for production sends to any Belize number.`
    );
  }

  if (channel === "whatsapp") {
    if (code === 68008 || code === 63008 || /whatsapp channel not configured|messaging service|whatsapp sender/i.test(raw)) {
      return new Error(
        `WhatsApp is not linked to your Verify service yet${withCode}. In Twilio Console: Verify → your Service → WhatsApp tab → select Messaging Service “Dashboard Research Verification System” (sender +1 711 344 5053) → Save.`
      );
    }
    if (code === 60242 || /whatsapp template/i.test(raw)) {
      return new Error(
        `WhatsApp authentication template is missing or not approved${withCode}. In Twilio, open Content Template Builder and confirm the Verify WhatsApp auth template is approved.`
      );
    }
    if (code === 60200) {
      return new Error(
        `Twilio rejected the WhatsApp send request${withCode}: ${raw}. Confirm the number is in E.164 format and Verify → WhatsApp tab has your Messaging Service selected.`
      );
    }
    return new Error(raw ? `${raw}${withCode}` : "Could not send a WhatsApp verification code.");
  }

  return new Error(raw ? `${raw}${withCode}` : "Could not send a verification code.");
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
