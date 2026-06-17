import { createHmac, timingSafeEqual } from "crypto";
import type { StaffRole } from "./staff-roles";

export const ADMIN_SESSION_COOKIE = "brp_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export interface AdminSession {
  role: StaffRole;
  email: string;
  staffId: string;
  displayName: string;
  exp: number;
}

function sessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET ?? "belize-research-panel-dev-secret";
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function encodeAdminSessionToken(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function decodeAdminSessionToken(token: string): AdminSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as AdminSession;
    if (!parsed.role || !parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createAdminSessionExpiry(): number {
  return Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
}
