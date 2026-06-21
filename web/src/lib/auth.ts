import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { SessionAccount } from "./auth-types";
import { findAccountById, toSessionAccount } from "./accounts";

export const SESSION_COOKIE = "brp_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret(): string {
  return process.env.AUTH_SESSION_SECRET ?? "belize-research-panel-dev-secret";
}

function signSessionPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function encodeSession(accountId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      accountId,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    })
  ).toString("base64url");
  return `${payload}.${signSessionPayload(payload)}`;
}

function decodeSession(token: string): { accountId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = signSessionPayload(payload);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as {
      accountId?: string;
      exp?: number;
    };
    if (!parsed.accountId || !parsed.exp || parsed.exp < Date.now()) return null;
    return { accountId: parsed.accountId };
  } catch {
    return null;
  }
}

export async function setSessionCookie(accountId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(accountId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionAccount(): Promise<SessionAccount | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const decoded = decodeSession(token);
  if (!decoded) return null;
  const account = await findAccountById(decoded.accountId);
  if (!account) return null;
  return toSessionAccount(account);
}

export function buildVerificationUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildEmailChangeVerificationUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}&purpose=email-change`;
}

export function buildPasswordResetUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildStaffPasswordResetUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/admin/reset-password?token=${encodeURIComponent(token)}`;
}
