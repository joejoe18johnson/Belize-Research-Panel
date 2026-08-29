import { promises as fs } from "fs";
import path from "path";
import type { PanelistRow } from "./panelists";
import { cleanText } from "./validation";
import { panelistHasPhotoDocument, type UsernameCollection } from "./panelist-documents";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export async function loadPanelistPhotoUploadUsernames(): Promise<Set<string>> {
  const usernames = await loadPanelistUploadUsernamesForPrefix("photo-id-");
  try {
    const { loadPanelists } = await import("./panelists");
    for (const row of await loadPanelists()) {
      if (!cleanText(row.photo_id_path)) continue;
      const username = cleanText(row.username);
      if (username) usernames.add(username);
    }
  } catch {
    // Local username set is still usable.
  }
  return usernames;
}

export async function loadPanelistResidenceUploadUsernames(): Promise<Set<string>> {
  const usernames = await loadPanelistUploadUsernamesForPrefix("residence-proof-");
  try {
    const { loadPanelists } = await import("./panelists");
    for (const row of await loadPanelists()) {
      if (!cleanText(row.residence_proof_path)) continue;
      const username = cleanText(row.username);
      if (username) usernames.add(username);
    }
  } catch {
    // Local username set is still usable.
  }
  return usernames;
}

async function loadPanelistUploadUsernamesForPrefix(prefix: string): Promise<Set<string>> {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const usernames = new Set<string>();
    for (const file of files) {
      if (!file.startsWith(prefix)) continue;
      const rest = file.slice(prefix.length);
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
  photoUploadUsernames: UsernameCollection
) {
  const email = cleanText(panelist.email).toLowerCase();
  const account = email ? accountsByEmail.get(email) : undefined;

  return {
    emailVerified: account ? account.email_verified === "true" : undefined,
    pendingPhone: Boolean(cleanText(account?.pending_phone_whatsapp)),
    hasPhotoUpload: panelistHasPhotoDocument(panelist, photoUploadUsernames),
  };
}
