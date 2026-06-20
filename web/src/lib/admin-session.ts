import type { StaffRole } from "./staff-roles";
import { normalizeStaffRole } from "./staff-roles";

export const ADMIN_SESSION_COOKIE = "brp_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export interface AdminSession {
  role: StaffRole;
  email: string;
  staffId: string;
  displayName: string;
  /** Module slugs this session may access; set at login from role permissions. */
  allowedModules?: string[];
  exp: number;
}

function sessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET ?? "belize-research-panel-dev-secret";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function stringToBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToString(value: string): string {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

let hmacKeyPromise: Promise<CryptoKey> | null = null;

function getHmacKey(): Promise<CryptoKey> {
  if (!hmacKeyPromise) {
    hmacKeyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(sessionSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }
  return hmacKeyPromise;
}

async function signPayload(payload: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function encodeAdminSessionToken(session: AdminSession): Promise<string> {
  const payload = stringToBase64Url(JSON.stringify(session));
  return `${payload}.${await signPayload(payload)}`;
}

export async function decodeAdminSessionToken(token: string): Promise<AdminSession | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await signPayload(payload);
  if (!timingSafeEqualStrings(signature, expected)) return null;

  try {
    const parsed = JSON.parse(base64UrlToString(payload)) as AdminSession;
    const role = normalizeStaffRole(parsed.role);
    if (!role || !parsed.exp || parsed.exp < Date.now()) return null;
    return { ...parsed, role };
  } catch {
    return null;
  }
}

export function createAdminSessionExpiry(): number {
  return Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
}
