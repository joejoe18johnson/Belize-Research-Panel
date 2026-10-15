/**
 * Client-safe Twilio Verify feature flag (env only — no Twilio SDK).
 * Keep SDK imports in `twilio-verify.ts` (server-only).
 */
function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

export function isTwilioVerifyConfigured(): boolean {
  if (process.env.TWILIO_VERIFY_ENABLED === "false") return false;
  return Boolean(
    cleanEnv(process.env.TWILIO_ACCOUNT_SID) &&
      cleanEnv(process.env.TWILIO_AUTH_TOKEN) &&
      cleanEnv(process.env.TWILIO_VERIFY_SERVICE_SID)
  );
}
