import { promises as fs } from "fs";
import path from "path";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export async function loadPanelistPhotoUploadUsernames(): Promise<Set<string>> {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const usernames = new Set<string>();
    for (const file of files) {
      if (!file.startsWith("photo-id-")) continue;
      const rest = file.slice("photo-id-".length);
      const dot = rest.lastIndexOf(".");
      const stem = dot >= 0 ? rest.slice(0, dot) : rest;
      if (stem) usernames.add(stem);
    }
    return usernames;
  } catch {
    return new Set();
  }
}

export function requirementContextForPanelist(
  panelist: PanelistRow,
  accountsByEmail: Map<string, { email_verified?: string; pending_phone_whatsapp?: string }>,
  photoUploadUsernames: Set<string>
) {
  const email = cleanText(panelist.email).toLowerCase();
  const account = email ? accountsByEmail.get(email) : undefined;
  const username = cleanText(panelist.username);

  return {
    emailVerified: account ? account.email_verified === "true" : undefined,
    pendingPhone: Boolean(cleanText(account?.pending_phone_whatsapp)),
    hasPhotoUpload: username ? photoUploadUsernames.has(username) : false,
  };
}
