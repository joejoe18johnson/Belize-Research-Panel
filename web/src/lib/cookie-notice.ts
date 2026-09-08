export const COOKIE_NOTICE_STORAGE_KEY = "brp-cookie-notice-accepted";

export function hasAcceptedCookieNotice(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(COOKIE_NOTICE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function acceptCookieNotice(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}
