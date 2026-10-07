import { promises as fs } from "fs";
import path from "path";
import { setNotificationRead, loadNotificationReadState } from "./notification-state";
import { clearPanelistPhotoIdPath, findPanelistUpload, type PanelistRow } from "./panelists";
import { isPanelistVerified } from "./verification-status";
import { cleanText } from "./validation";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

/** Set after the photo ID file is removed, so the panelist sees the deletion notice once. */
export const PHOTO_ID_PURGED_MARKER = "__purged:photo-id";

export const ID_DOCUMENT_DELETED_NOTICE =
  "Your photo ID document has been deleted and wiped from our database. We do not keep identification images on file after your account is verified.";

export async function isPhotoIdDocumentPurged(email: string): Promise<boolean> {
  const key = cleanText(email).toLowerCase();
  if (!key) return false;
  const readState = await loadNotificationReadState(key);
  return Boolean(readState[PHOTO_ID_PURGED_MARKER]?.read);
}

async function deleteLocalPhotoIdFiles(username: string): Promise<boolean> {
  const safeUsername = cleanText(username);
  if (!safeUsername) return false;

  let files: string[] = [];
  try {
    files = await fs.readdir(UPLOADS_DIR);
  } catch {
    return false;
  }

  const matches = files.filter((file) => file.startsWith(`photo-id-${safeUsername}`));
  if (!matches.length) return false;

  await Promise.all(
    matches.map((file) => fs.unlink(path.join(UPLOADS_DIR, file)).catch(() => undefined))
  );
  return true;
}

async function photoIdDocumentExists(panelist: PanelistRow): Promise<boolean> {
  if (cleanText(panelist.photo_id_path)) return true;
  const local = await findPanelistUpload(cleanText(panelist.username), "photo-id");
  if (local) return true;

  const { useSupabase } = await import("./supabase/data-source");
  if (!useSupabase()) return false;

  const { supabaseFindPanelistDocumentPath } = await import("./supabase/repos");
  const stored = await supabaseFindPanelistDocumentPath(panelist, "photo_id");
  return Boolean(stored);
}

/**
 * Removes the stored photo ID file once the account is verified.
 * Returns true only the first time a document is actually deleted.
 */
async function purgePhotoIdAfterVerificationNow(panelist: PanelistRow): Promise<boolean> {
  const email = cleanText(panelist.email).toLowerCase();
  if (!email || !isPanelistVerified(panelist.verification_status)) return false;

  const readState = await loadNotificationReadState(email);
  if (readState[PHOTO_ID_PURGED_MARKER]?.read) return false;
  if (!(await photoIdDocumentExists(panelist))) return false;

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseDeletePhotoIdDocument } = await import("./supabase/repos");
    await supabaseDeletePhotoIdDocument(panelist);
  }

  await deleteLocalPhotoIdFiles(panelist.username);
  await clearPanelistPhotoIdPath(email);
  await setNotificationRead(email, PHOTO_ID_PURGED_MARKER, true);
  return true;
}

/**
 * Removes the stored photo ID file once the account is verified.
 * Returns true only the first time a document is actually deleted.
 * Failures are logged and swallowed so opening the dashboard cannot 500.
 */
export async function purgePhotoIdAfterVerification(panelist: PanelistRow): Promise<boolean> {
  try {
    return await purgePhotoIdAfterVerificationNow(panelist);
  } catch (error) {
    console.error("[photo-id] verified ID could not be deleted; dashboard will still load", error);
    return false;
  }
}
