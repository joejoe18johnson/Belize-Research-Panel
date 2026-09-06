/** Client-safe Facebook auth helpers (no Node fs / crypto). */

export function isFacebookLoginConfigured(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_FACEBOOK_LOGIN === "false") return false;
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function facebookPlaceholderEmail(facebookUserId: string): string {
  const safeId = String(facebookUserId || "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "");
  return `fb.${safeId || "unknown"}@facebook.oauth.local`;
}

export function isFacebookPlaceholderEmail(email: string): boolean {
  return String(email || "")
    .trim()
    .toLowerCase()
    .endsWith("@facebook.oauth.local");
}

export const FACEBOOK_ELIGIBILITY_STORAGE_KEY = "brp_facebook_signup_eligibility";
