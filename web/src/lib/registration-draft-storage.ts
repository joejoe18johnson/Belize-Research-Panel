import type { RegistrationFormData } from "./registration-types";

const DRAFT_VERSION = 2;
const FILE_DB_NAME = "brp-registration-drafts";
const FILE_STORE = "files";

export type RegistrationDraftSnapshot = Omit<
  RegistrationFormData,
  "photoIdFile" | "proofOfBelizeResidenceFile"
> & {
  photoIdFileName?: string;
  proofOfBelizeResidenceFileName?: string;
};

export interface RegistrationDraft {
  version: number;
  accountEmail: string;
  form: RegistrationDraftSnapshot;
  activePhaseIndex: number;
  furthestPhaseIndex?: number;
  savedAt: string;
}

export interface RegistrationDraftFiles {
  photoIdFile: File | null;
  proofOfBelizeResidenceFile: File | null;
}

function draftKey(accountEmail: string): string {
  return `brp-registration-draft:${accountEmail.trim().toLowerCase()}`;
}

function fileRecordKey(accountEmail: string, kind: "photoId" | "residence"): string {
  return `${accountEmail.trim().toLowerCase()}:${kind}`;
}

function toSnapshot(form: RegistrationFormData): RegistrationDraftSnapshot {
  const { photoIdFile, proofOfBelizeResidenceFile, ...rest } = form;
  return {
    ...rest,
    photoIdFileName: photoIdFile?.name || undefined,
    proofOfBelizeResidenceFileName: proofOfBelizeResidenceFile?.name || undefined,
  };
}

export function loadRegistrationDraft(accountEmail: string): RegistrationDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(accountEmail));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistrationDraft;
    if (parsed.version !== DRAFT_VERSION && parsed.version !== 1) return null;
    if (parsed.accountEmail.trim().toLowerCase() !== accountEmail.trim().toLowerCase()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRegistrationDraft(input: {
  accountEmail: string;
  form: RegistrationFormData;
  activePhaseIndex: number;
  furthestPhaseIndex?: number;
}): void {
  if (typeof window === "undefined") return;
  try {
    const draft: RegistrationDraft = {
      version: DRAFT_VERSION,
      accountEmail: input.accountEmail.trim().toLowerCase(),
      form: toSnapshot(input.form),
      activePhaseIndex: input.activePhaseIndex,
      furthestPhaseIndex: Math.max(input.activePhaseIndex, input.furthestPhaseIndex ?? input.activePhaseIndex),
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(draftKey(input.accountEmail), JSON.stringify(draft));
  } catch {
    // localStorage may be unavailable in private mode — ignore
  }
}

export function clearRegistrationDraft(accountEmail: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(accountEmail));
  } catch {
    // ignore
  }
  void clearRegistrationDraftFiles(accountEmail);
}

export function mergeDraftIntoForm(
  base: RegistrationFormData,
  draft: RegistrationDraft,
  files?: RegistrationDraftFiles
): RegistrationFormData {
  const { photoIdFileName, proofOfBelizeResidenceFileName, ...formFields } = draft.form;
  return {
    ...base,
    ...formFields,
    registrationMode: "Self-registration",
    authorisedVerificationCode: "",
    photoIdFile: files?.photoIdFile ?? null,
    proofOfBelizeResidenceFile: files?.proofOfBelizeResidenceFile ?? null,
  };
}

export function draftRestoredFileHint(draft: RegistrationDraft, files?: RegistrationDraftFiles): string | null {
  const missing: string[] = [];
  if (draft.form.photoIdFileName && !files?.photoIdFile) missing.push(draft.form.photoIdFileName);
  if (draft.form.proofOfBelizeResidenceFileName && !files?.proofOfBelizeResidenceFile) {
    missing.push(draft.form.proofOfBelizeResidenceFileName);
  }
  if (!missing.length) return null;
  return `Your saved answers were restored. Please re-upload: ${missing.join(" and ")}.`;
}

function openFileDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = window.indexedDB.open(FILE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) db.createObjectStore(FILE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function fileToRecord(file: File | null): Promise<{
  name: string;
  type: string;
  lastModified: number;
  buffer: ArrayBuffer;
} | null> {
  if (!file) return null;
  return {
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    buffer: await file.arrayBuffer(),
  };
}

function recordToFile(record: {
  name: string;
  type: string;
  lastModified: number;
  buffer: ArrayBuffer;
} | null): File | null {
  if (!record) return null;
  return new File([record.buffer], record.name, {
    type: record.type,
    lastModified: record.lastModified,
  });
}

export async function saveRegistrationDraftFiles(
  accountEmail: string,
  files: RegistrationDraftFiles
): Promise<void> {
  const db = await openFileDb();
  if (!db) return;
  const photo = await fileToRecord(files.photoIdFile);
  const residence = await fileToRecord(files.proofOfBelizeResidenceFile);
  await new Promise<void>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    const store = tx.objectStore(FILE_STORE);
    const photoKey = fileRecordKey(accountEmail, "photoId");
    const residenceKey = fileRecordKey(accountEmail, "residence");
    if (photo) store.put(photo, photoKey);
    else store.delete(photoKey);
    if (residence) store.put(residence, residenceKey);
    else store.delete(residenceKey);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
  db.close();
}

export async function loadRegistrationDraftFiles(accountEmail: string): Promise<RegistrationDraftFiles> {
  const empty: RegistrationDraftFiles = { photoIdFile: null, proofOfBelizeResidenceFile: null };
  const db = await openFileDb();
  if (!db) return empty;
  const records = await new Promise<RegistrationDraftFiles>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readonly");
    const store = tx.objectStore(FILE_STORE);
    const photoReq = store.get(fileRecordKey(accountEmail, "photoId"));
    const residenceReq = store.get(fileRecordKey(accountEmail, "residence"));
    tx.oncomplete = () => {
      resolve({
        photoIdFile: recordToFile(photoReq.result ?? null),
        proofOfBelizeResidenceFile: recordToFile(residenceReq.result ?? null),
      });
    };
    tx.onerror = () => resolve(empty);
    tx.onabort = () => resolve(empty);
  });
  db.close();
  return records;
}

export async function clearRegistrationDraftFiles(accountEmail: string): Promise<void> {
  const db = await openFileDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(FILE_STORE, "readwrite");
    const store = tx.objectStore(FILE_STORE);
    store.delete(fileRecordKey(accountEmail, "photoId"));
    store.delete(fileRecordKey(accountEmail, "residence"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
  db.close();
}
