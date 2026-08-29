import { readFile } from "fs/promises";
import path from "path";
import type { PanelistRow } from "./panelists";
import { findPanelistUpload } from "./panelists";
import { cleanText } from "./validation";
import type { PanelistDocumentKind } from "./panelist-document-view";

export type { PanelistDocumentKind, UsernameCollection } from "./panelist-document-view";
export {
  adminPanelistDocumentUrl,
  panelistHasPhotoDocument,
  panelistHasResidenceDocument,
  panelistShouldOfferPhotoIdView,
  usernameSet,
} from "./panelist-document-view";

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
