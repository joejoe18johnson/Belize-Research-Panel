import { readFile } from "fs/promises";
import path from "path";
import type { PanelistRow } from "./panelists";
import { findPanelistUpload } from "./panelists";
import { cleanText } from "./validation";

export type PanelistDocumentKind = "photo-id" | "residence-proof";

export interface PanelistDocumentFile {
  buffer: Buffer;
  filename: string;
  contentType: string;
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
  photoUploadUsernames: Set<string> = new Set()
): boolean {
  if (cleanText(panelist.photo_id_path)) return true;
  const username = cleanText(panelist.username);
  return Boolean(username && photoUploadUsernames.has(username));
}

export function panelistHasResidenceDocument(
  panelist: Pick<PanelistRow, string>,
  residenceUploadUsernames: Set<string> = new Set()
): boolean {
  if (cleanText(panelist.residence_proof_path)) return true;
  const username = cleanText(panelist.username);
  return Boolean(username && residenceUploadUsernames.has(username));
}

export async function loadPanelistVerificationDocument(
  panelist: PanelistRow,
  kind: PanelistDocumentKind
): Promise<PanelistDocumentFile | null> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const storageKind = kind === "photo-id" ? "photo_id" : "residence_proof";
    const { supabaseFindPanelistDocumentPath, supabaseDownloadPanelistDocument } = await import("./supabase/repos");
    const storagePath = await supabaseFindPanelistDocumentPath(panelist, storageKind);
    if (storagePath) {
      const downloaded = await supabaseDownloadPanelistDocument(storagePath);
      if (downloaded) return downloaded;
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
