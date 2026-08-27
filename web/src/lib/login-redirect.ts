import { cleanText } from "./validation";

const FALLBACK_NEXT = "/dashboard";

/** Internal app paths that are safe to return to after login. */
export function safeAppNextPath(value: string | undefined | null, fallback = FALLBACK_NEXT): string {
  let raw = cleanText(value);
  if (!raw) return fallback;

  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const url = new URL(raw);
      raw = `${url.pathname}${url.search}`;
    }
  } catch {
    return fallback;
  }

  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (raw.startsWith("/admin") || raw.startsWith("/client") || raw.startsWith("/api") || raw.startsWith("/login")) {
    return fallback;
  }

  return raw;
}

export function loginUrlForPath(pathname: string, search = ""): string {
  const next = safeAppNextPath(`${pathname}${search}`, FALLBACK_NEXT);
  return `/login?next=${encodeURIComponent(next)}`;
}
