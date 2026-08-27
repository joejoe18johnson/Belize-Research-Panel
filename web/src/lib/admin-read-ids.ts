import { cleanText } from "./validation";

export const PANELIST_VERIFICATION_NOTIFICATION_TYPE = "Panelist verification";

export function adminNotificationId(type: string, email: string): string {
  return `${cleanText(type).toLowerCase()}:${cleanText(email).toLowerCase()}`;
}

export function adminPanelistVerificationId(email: string): string {
  return adminNotificationId(PANELIST_VERIFICATION_NOTIFICATION_TYPE, email);
}
