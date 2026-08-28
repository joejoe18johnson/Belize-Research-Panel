import type { RegistrationFormData } from "./registration-types";

const DRAFT_VERSION = 1;

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
  savedAt: string;
}

function draftKey(accountEmail: string): string {
  return `brp-registration-draft:${accountEmail.trim().toLowerCase()}`;
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
    const raw = sessionStorage.getItem(draftKey(accountEmail));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistrationDraft;
    if (parsed.version !== DRAFT_VERSION) return null;
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
}): void {
  if (typeof window === "undefined") return;
  try {
    const draft: RegistrationDraft = {
      version: DRAFT_VERSION,
      accountEmail: input.accountEmail.trim().toLowerCase(),
      form: toSnapshot(input.form),
      activePhaseIndex: input.activePhaseIndex,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(draftKey(input.accountEmail), JSON.stringify(draft));
  } catch {
    // sessionStorage may be unavailable in private mode — ignore
  }
}

export function clearRegistrationDraft(accountEmail: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(draftKey(accountEmail));
  } catch {
    // ignore
  }
}

export function mergeDraftIntoForm(
  base: RegistrationFormData,
  draft: RegistrationDraft
): RegistrationFormData {
  const { photoIdFileName, proofOfBelizeResidenceFileName, ...formFields } = draft.form;
  return {
    ...base,
    ...formFields,
    registrationMode: "Self-registration",
    authorisedVerificationCode: "",
    photoIdFile: null,
    proofOfBelizeResidenceFile: null,
  };
}

export function draftRestoredFileHint(draft: RegistrationDraft): string | null {
  const names = [draft.form.photoIdFileName, draft.form.proofOfBelizeResidenceFileName].filter(Boolean);
  if (!names.length) return null;
  return `Your saved answers were restored. Please re-upload: ${names.join(" and ")}.`;
}
