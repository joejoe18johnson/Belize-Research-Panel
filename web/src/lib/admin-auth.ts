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
  adminPathAllowedForSession,
  staffDefaultAdminPath,
} from "./staff-roles";
import { getRoleModuleSlugs } from "./staff-role-access";
import { verifyStaffUserLogin, type StaffUserRecord } from "./staff-users";

export type { AdminSession } from "./admin-session";
export { ADMIN_SESSION_COOKIE, decodeAdminSessionToken } from "./admin-session";

function staffDisplayName(user: StaffUserRecord): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export async function setAdminSessionCookie(session: Omit<AdminSession, "exp">): Promise<void> {
  const cookieStore = await cookies();
  const token = await encodeAdminSessionToken({
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
  const session = await decodeAdminSessionToken(token);
  if (!session) return null;
  const allowedModules = await getRoleModuleSlugs(session.role);
  return { ...session, allowedModules };
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
  if (!adminPathAllowedForSession(session, pathname)) {
    redirect(`${staffDefaultAdminPath(session.role, session.allowedModules)}?access=denied`);
  }
  return session;
}

export async function requireSuperAdminSession(): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (session.role !== "super_admin") {
    redirect(`${staffDefaultAdminPath(session.role, session.allowedModules)}?access=denied`);
  }
  return session;
}

export async function getSuperAdminSession(): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

export async function authenticateStaffLogin(
  email: string | undefined,
  password: string
): Promise<Omit<AdminSession, "exp"> | null> {
  const trimmedEmail = email?.trim() ?? "";
  const trimmedPassword = password.trim();
  if (!trimmedEmail || !trimmedPassword) return null;

  const user = await verifyStaffUserLogin(trimmedEmail, trimmedPassword);
  if (!user) return null;
  const allowedModules = await getRoleModuleSlugs(user.role);
  return {
    role: user.role,
    email: user.email,
    staffId: user.id,
    displayName: staffDisplayName(user),
    allowedModules,
  };
}

export async function adminSessionFromStaffUser(
  user: StaffUserRecord
): Promise<Omit<AdminSession, "exp">> {
  const allowedModules = await getRoleModuleSlugs(user.role);
  return {
    role: user.role,
    email: user.email,
    staffId: user.id,
    displayName: staffDisplayName(user),
    allowedModules,
  };
}
