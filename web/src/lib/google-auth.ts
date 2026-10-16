/** Client-safe Google auth helpers (no Node fs / crypto). */

function cleanPublicEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

/**
 * Google OAuth credentials live in Supabase Auth → Providers → Google.
 * The app only needs public Supabase URL + anon key (and the feature not forced off).
 */
export function isGoogleLoginConfigured(): boolean {
  if (cleanPublicEnv(process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN).toLowerCase() === "false") {
    return false;
  }
  return Boolean(
    cleanPublicEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      cleanPublicEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export function googlePlaceholderEmail(googleUserId: string): string {
  const safeId = String(googleUserId || "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "");
  return `google.${safeId || "unknown"}@google.oauth.local`;
}

export function isGooglePlaceholderEmail(email: string): boolean {
  return String(email || "")
    .trim()
    .toLowerCase()
    .endsWith("@google.oauth.local");
}

export const GOOGLE_ELIGIBILITY_STORAGE_KEY = "brp_google_signup_eligibility";
