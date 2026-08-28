import { cleanText } from "./validation";

export interface AuthorisedRegistrar {
  id: string;
  name: string;
  code: string;
  notes: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface AuthorisedRegistrarStore {
  registrars: AuthorisedRegistrar[];
}

export const AUTHORISED_CODE_LENGTH = 6;
export const AUTHORISED_CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function normalizeAuthorisedCode(code: string): string {
  return cleanText(code).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidAuthorisedCode(code: string): boolean {
  return AUTHORISED_CODE_PATTERN.test(normalizeAuthorisedCode(code));
}

export function parseAuthorisedRegistration(panelist: {
  notes?: string;
  authorised_verification_code?: string;
  authorised_registrar_name?: string;
}): {
  isAuthorised: boolean;
  code: string;
  registrarName: string;
} {
  const code = cleanText(panelist.authorised_verification_code ?? "");
  const registrarName = cleanText(panelist.authorised_registrar_name ?? "");
  if (code || registrarName) {
    return { isAuthorised: true, code, registrarName };
  }

  const notes = cleanText(panelist.notes);
  if (!notes.toLowerCase().includes("authorised registration")) {
    return { isAuthorised: false, code: "", registrarName: "" };
  }

  const codeMatch = notes.match(/code:\s*([^;]+)/i);
  const nameMatch = notes.match(/registrar:\s*([^;]+)/i);
  return {
    isAuthorised: true,
    code: cleanText(codeMatch?.[1] ?? ""),
    registrarName: cleanText(nameMatch?.[1] ?? ""),
  };
}

export function authorisedRegistrationNotes(code: string, registrarName: string): string {
  const parts = ["Authorised registration", `code: ${normalizeAuthorisedCode(code)}`];
  if (cleanText(registrarName)) parts.push(`registrar: ${cleanText(registrarName)}`);
  return parts.join("; ");
}

export function formatAuthorisedByLabel(panelist: {
  notes?: string;
  authorised_verification_code?: string;
  authorised_registrar_name?: string;
}): string {
  const parsed = parseAuthorisedRegistration(panelist);
  if (!parsed.isAuthorised) return "";
  if (parsed.registrarName && parsed.code) return `${parsed.registrarName} (${parsed.code})`;
  if (parsed.registrarName) return parsed.registrarName;
  if (parsed.code) return parsed.code;
  return "Authorised registration";
}

export function findRegistrarByCode(
  registrars: AuthorisedRegistrar[],
  code: string,
  options: { activeOnly?: boolean } = {}
): AuthorisedRegistrar | null {
  const normalized = normalizeAuthorisedCode(code);
  if (!normalized) return null;
  return (
    registrars.find((registrar) => {
      if (options.activeOnly && !registrar.active) return false;
      return normalizeAuthorisedCode(registrar.code) === normalized;
    }) ?? null
  );
}
