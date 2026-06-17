/** Admin console entry — replace public button with a private link when staff auth is ready. */
export const ADMIN_LOGIN_PATH = "/admin/login";

export function isAdminEntryVisible(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_ADMIN_ENTRY !== "false";
}
