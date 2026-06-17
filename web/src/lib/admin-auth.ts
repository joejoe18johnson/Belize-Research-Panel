import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionExpiry,
  decodeAdminSessionToken,
  encodeAdminSessionToken,
  type AdminSession,
} from "./admin-session";
import {
  adminPathAllowedForRole,
  staffDefaultAdminPath,
} from "./staff-roles";
import { verifyStaffUserLogin, type StaffUserRecord } from "./staff-users";

export type { AdminSession } from "./admin-session";
export { ADMIN_SESSION_COOKIE, decodeAdminSessionToken } from "./admin-session";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || "admin123";
}

export function verifyAdminPassword(password: string): boolean {
  const expected = adminPassword();
  const provided = Buffer.from(password);
  const target = Buffer.from(expected);
  if (provided.length !== target.length) return false;
  return timingSafeEqual(provided, target);
}

function staffDisplayName(user: StaffUserRecord): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export async function setAdminSessionCookie(session: Omit<AdminSession, "exp">): Promise<void> {
  const cookieStore = await cookies();
  const token = encodeAdminSessionToken({
    ...session,
    exp: createAdminSessionExpiry(),
  });
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeAdminSessionToken(token);
}

export async function isAdminSessionActive(): Promise<boolean> {
  return Boolean(await getAdminSession());
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAdminPathAccess(pathname: string): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (!adminPathAllowedForRole(session.role, pathname)) {
    redirect(`${staffDefaultAdminPath(session.role)}?access=denied`);
  }
  return session;
}

export async function authenticateStaffLogin(
  email: string | undefined,
  password: string
): Promise<Omit<AdminSession, "exp"> | null> {
  const trimmedEmail = email?.trim() ?? "";
  const trimmedPassword = password.trim();
  if (!trimmedPassword) return null;

  if (trimmedEmail) {
    const user = await verifyStaffUserLogin(trimmedEmail, trimmedPassword);
    if (!user) return null;
    return {
      role: user.role,
      email: user.email,
      staffId: user.id,
      displayName: staffDisplayName(user),
    };
  }

  if (!verifyAdminPassword(trimmedPassword)) return null;
  return {
    role: "super_admin",
    email: "legacy-admin@belizepanel.local",
    staffId: "legacy-admin",
    displayName: "Legacy Admin Password",
  };
}
