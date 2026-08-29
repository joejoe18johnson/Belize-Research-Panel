import { readFile } from "fs/promises";
import path from "path";
import type { PanelistRow } from "./panelists";
import { findPanelistUpload } from "./panelists";
import { cleanText } from "./validation";

export type PanelistDocumentKind = "photo-id" | "residence-proof";
export type UsernameCollection = Set<string> | readonly string[] | null | undefined;

export interface PanelistDocumentFile {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

export function usernameSet(value: UsernameCollection): Set<string> {
  if (!value) return new Set();
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value.map((item) => cleanText(item)).filter(Boolean));
  return new Set();
}

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function adminPanelistDocumentUrl(email: string, kind: PanelistDocumentKind): string {
  return `/api/admin/panelists/${encodeURIComponent(email)}/document?kind=${kind}`;
}

export function panelistHasPhotoDocument(
  panelist: Pick<PanelistRow, string>,
  photoUploadUsernames: UsernameCollection = []
): boolean {
  if (cleanText(panelist.photo_id_path)) return true;
  const username = cleanText(panelist.username);
  return Boolean(username && usernameSet(photoUploadUsernames).has(username));
}

export function panelistHasResidenceDocument(
  panelist: Pick<PanelistRow, string>,
  residenceUploadUsernames: UsernameCollection = []
): boolean {
  if (cleanText(panelist.residence_proof_path)) return true;
  const username = cleanText(panelist.username);
  return Boolean(username && usernameSet(residenceUploadUsernames).has(username));
}

/** Offer the admin document viewer when a file is known or an ID type was declared at signup. */
export function panelistShouldOfferPhotoIdView(
  panelist: Pick<PanelistRow, string>,
  photoUploadUsernames: UsernameCollection = []
): boolean {
  return panelistHasPhotoDocument(panelist, photoUploadUsernames) || Boolean(cleanText(panelist.photo_id_type));
}

export async function loadPanelistVerificationDocument(
  panelist: PanelistRow,
  kind: PanelistDocumentKind
): Promise<PanelistDocumentFile | null> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const storageKind = kind === "photo-id" ? "photo_id" : "residence_proof";
    const { supabaseFindPanelistDocumentPath, supabaseDownloadPanelistDocument } = await import("./supabase/repos");
    let storagePath = await supabaseFindPanelistDocumentPath(panelist, storageKind);
    let downloaded = storagePath ? await supabaseDownloadPanelistDocument(storagePath) : null;
    if (!downloaded) {
      storagePath = await supabaseFindPanelistDocumentPath(panelist, storageKind, { ignoreStored: true });
      downloaded = storagePath ? await supabaseDownloadPanelistDocument(storagePath) : null;
    }
    if (downloaded && storagePath) {
      const storedPath = cleanText(
        storageKind === "photo_id" ? panelist.photo_id_path : panelist.residence_proof_path
      );
      if (storedPath !== storagePath && panelist.email) {
        const { supabaseBackfillPanelistDocumentPath } = await import("./supabase/repos");
        void supabaseBackfillPanelistDocumentPath(panelist.email, storageKind, storagePath);
      }
      return downloaded;
    }
  }

  const upload = await findPanelistUpload(cleanText(panelist.username), kind);
  if (!upload) return null;
  const ext = path.extname(upload.filename).toLowerCase();
  return {
    buffer: await readFile(upload.absolutePath),
    filename: upload.filename,
    contentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
  };
}
