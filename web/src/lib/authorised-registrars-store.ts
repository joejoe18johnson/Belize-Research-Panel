import { randomBytes, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  AUTHORISED_CODE_LENGTH,
  findRegistrarByCode,
  isAuthorisedCodeUsed,
  isValidAuthorisedCode,
  normalizeAuthorisedCode,
  type AuthorisedRegistrar,
  type AuthorisedRegistrarStore,
} from "./authorised-registrars";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "authorised-registrars.json");

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateAuthorisedCode(): string {
  const bytes = randomBytes(AUTHORISED_CODE_LENGTH);
  let out = "";
  for (let i = 0; i < AUTHORISED_CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

function emptyStore(): AuthorisedRegistrarStore {
  return { registrars: [] };
}

function normalizeStore(raw: Partial<AuthorisedRegistrarStore> | null | undefined): AuthorisedRegistrarStore {
  const registrars = Array.isArray(raw?.registrars) ? raw!.registrars : [];
  return {
    registrars: registrars
      .map((item) => ({
        id: cleanText(item.id) || randomUUID(),
        name: cleanText(item.name),
        code: normalizeAuthorisedCode(item.code),
        notes: cleanText(item.notes),
        active: item.active !== false,
        createdAt: cleanText(item.createdAt) || new Date().toISOString(),
        createdBy: cleanText(item.createdBy),
        usedAt: cleanText(item.usedAt),
        usedByEmail: cleanText(item.usedByEmail).toLowerCase(),
      }))
      .filter((item) => item.name && item.code),
  };
}

function isReadonlyFsError(error: unknown): boolean {
  const code =
    typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
  const message = error instanceof Error ? error.message : String(error);
  return code === "EROFS" || /EROFS|read-only file system/i.test(message);
}

async function readJsonFile(): Promise<AuthorisedRegistrarStore> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    return normalizeStore(JSON.parse(content) as Partial<AuthorisedRegistrarStore>);
  } catch {
    return emptyStore();
  }
}

async function writeJsonFile(store: AuthorisedRegistrarStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

async function writeJsonFileBestEffort(store: AuthorisedRegistrarStore): Promise<void> {
  const { isProductionDeploy } = await import("./supabase/data-source");
  if (isProductionDeploy()) return;
  try {
    await writeJsonFile(store);
  } catch (error) {
    if (isReadonlyFsError(error)) return;
    throw error;
  }
}

export async function loadAuthorisedRegistrars(): Promise<AuthorisedRegistrarStore> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadAuthorisedRegistrars, supabaseSaveAuthorisedRegistrars } = await import(
      "./supabase/repos"
    );
    const remote = await supabaseLoadAuthorisedRegistrars();
    if (remote !== null) return normalizeStore(remote);

    const seeded = await readJsonFile();
    try {
      await supabaseSaveAuthorisedRegistrars(seeded);
    } catch (error) {
      console.error("Could not persist authorised registrars to Supabase:", error);
    }
    return seeded;
  }
  return readJsonFile();
}

export async function saveAuthorisedRegistrars(store: AuthorisedRegistrarStore): Promise<AuthorisedRegistrarStore> {
  const next = normalizeStore(store);
  const { useSupabase, isProductionDeploy } = await import("./supabase/data-source");

  if (useSupabase()) {
    const { supabaseSaveAuthorisedRegistrars } = await import("./supabase/repos");
    await supabaseSaveAuthorisedRegistrars(next);
    await writeJsonFileBestEffort(next);
    return next;
  }

  if (isProductionDeploy()) {
    throw new Error("storage_not_configured");
  }

  await writeJsonFile(next);
  return next;
}

export async function findActiveAuthorisedRegistrar(code: string): Promise<AuthorisedRegistrar | null> {
  const store = await loadAuthorisedRegistrars();
  return findRegistrarByCode(store.registrars, code, { activeOnly: true, unusedOnly: true });
}

export type AuthorisedCodeLookup =
  | { status: "valid"; registrar: AuthorisedRegistrar }
  | { status: "used"; registrar: AuthorisedRegistrar }
  | { status: "inactive"; registrar: AuthorisedRegistrar }
  | { status: "unknown" };

export async function lookupAuthorisedCode(code: string): Promise<AuthorisedCodeLookup> {
  const store = await loadAuthorisedRegistrars();
  const registrar = findRegistrarByCode(store.registrars, code);
  if (!registrar) return { status: "unknown" };
  if (isAuthorisedCodeUsed(registrar)) return { status: "used", registrar };
  if (!registrar.active) return { status: "inactive", registrar };
  return { status: "valid", registrar };
}

export async function markAuthorisedCodeUsed(code: string, usedByEmail: string): Promise<AuthorisedRegistrar | null> {
  const store = await loadAuthorisedRegistrars();
  const match = findRegistrarByCode(store.registrars, code, { activeOnly: true, unusedOnly: true });
  if (!match) return null;
  const next = store.registrars.map((registrar) =>
    registrar.id === match.id
      ? {
          ...registrar,
          usedAt: new Date().toISOString(),
          usedByEmail: cleanText(usedByEmail).toLowerCase(),
        }
      : registrar
  );
  await saveAuthorisedRegistrars({ registrars: next });
  return next.find((registrar) => registrar.id === match.id) ?? null;
}

export async function createAuthorisedRegistrar(input: {
  name: string;
  code?: string;
  notes?: string;
  createdBy: string;
}): Promise<{ ok: true; registrar: AuthorisedRegistrar } | { ok: false; message: string }> {
  const name = cleanText(input.name);
  if (!name) return { ok: false, message: "Enter the authorised person's name." };

  let code = normalizeAuthorisedCode(input.code ?? "");
  if (!code) code = generateAuthorisedCode();
  if (!isValidAuthorisedCode(code)) {
    return {
      ok: false,
      message: `Authorisation codes must be exactly ${AUTHORISED_CODE_LENGTH} uppercase letters or numbers.`,
    };
  }

  const store = await loadAuthorisedRegistrars();
  if (findRegistrarByCode(store.registrars, code)) {
    return { ok: false, message: "That authorisation code is already in use." };
  }

  const registrar: AuthorisedRegistrar = {
    id: randomUUID(),
    name,
    code,
    notes: cleanText(input.notes),
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: cleanText(input.createdBy),
    usedAt: "",
    usedByEmail: "",
  };

  await saveAuthorisedRegistrars({ registrars: [...store.registrars, registrar] });
  return { ok: true, registrar };
}

export async function setAuthorisedRegistrarActive(
  id: string,
  active: boolean
): Promise<AuthorisedRegistrar | null> {
  const store = await loadAuthorisedRegistrars();
  const next = store.registrars.map((registrar) =>
    registrar.id === id ? { ...registrar, active } : registrar
  );
  const updated = next.find((registrar) => registrar.id === id) ?? null;
  if (!updated) return null;
  await saveAuthorisedRegistrars({ registrars: next });
  return updated;
}

export async function deleteAuthorisedRegistrar(id: string): Promise<boolean> {
  const store = await loadAuthorisedRegistrars();
  const next = store.registrars.filter((registrar) => registrar.id !== id);
  if (next.length === store.registrars.length) return false;
  await saveAuthorisedRegistrars({ registrars: next });
  return true;
}
