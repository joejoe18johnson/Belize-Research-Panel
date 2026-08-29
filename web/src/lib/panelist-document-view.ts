import { cleanText } from "./validation";

export type PanelistDocumentKind = "photo-id" | "residence-proof";
export type UsernameCollection = Set<string> | readonly string[] | null | undefined;

type PanelistDocumentFields = {
  photo_id_path?: string;
  residence_proof_path?: string;
  username?: string;
  photo_id_type?: string;
};

export function usernameSet(value: UsernameCollection): Set<string> {
  if (!value) return new Set();
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value.map((item) => cleanText(item)).filter(Boolean));
  return new Set();
}

export function adminPanelistDocumentUrl(email: string, kind: PanelistDocumentKind): string {
  return `/api/admin/panelists/${encodeURIComponent(email)}/document?kind=${kind}`;
}

export function panelistHasPhotoDocument(
  panelist: PanelistDocumentFields,
  photoUploadUsernames: UsernameCollection = []
): boolean {
  if (cleanText(panelist.photo_id_path)) return true;
  const username = cleanText(panelist.username);
  return Boolean(username && usernameSet(photoUploadUsernames).has(username));
}

export function panelistHasResidenceDocument(
  panelist: PanelistDocumentFields,
  residenceUploadUsernames: UsernameCollection = []
): boolean {
  if (cleanText(panelist.residence_proof_path)) return true;
  const username = cleanText(panelist.username);
  return Boolean(username && usernameSet(residenceUploadUsernames).has(username));
}

/** Offer the admin document viewer when a file is known or an ID type was declared at signup. */
export function panelistShouldOfferPhotoIdView(
  panelist: PanelistDocumentFields,
  photoUploadUsernames: UsernameCollection = []
): boolean {
  return panelistHasPhotoDocument(panelist, photoUploadUsernames) || Boolean(cleanText(panelist.photo_id_type));
}
