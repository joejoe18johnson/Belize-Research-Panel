import { cleanText } from "./validation";

export type PanelistDocumentKind = "photo-id" | "residence-proof";
export type UsernameCollection = Set<string> | readonly string[] | null | undefined;

function field(panelist: object, key: string): string {
  return cleanText(String((panelist as Record<string, unknown>)[key] ?? ""));
}

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
  panelist: object,
  photoUploadUsernames: UsernameCollection = []
): boolean {
  if (field(panelist, "photo_id_path")) return true;
  const username = field(panelist, "username");
  return Boolean(username && usernameSet(photoUploadUsernames).has(username));
}

export function panelistHasResidenceDocument(
  panelist: object,
  residenceUploadUsernames: UsernameCollection = []
): boolean {
  if (field(panelist, "residence_proof_path")) return true;
  const username = field(panelist, "username");
  return Boolean(username && usernameSet(residenceUploadUsernames).has(username));
}

/** Offer the admin document viewer when a file is known or an ID type was declared at signup. */
export function panelistShouldOfferPhotoIdView(
  panelist: object,
  photoUploadUsernames: UsernameCollection = []
): boolean {
  return panelistHasPhotoDocument(panelist, photoUploadUsernames) || Boolean(field(panelist, "photo_id_type"));
}
