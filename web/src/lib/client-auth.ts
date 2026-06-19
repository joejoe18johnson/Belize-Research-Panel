import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CLIENT_SESSION_COOKIE,
  CLIENT_SESSION_MAX_AGE_SECONDS,
  createClientSessionExpiry,
  decodeClientSessionToken,
  encodeClientSessionToken,
  type ClientSession,
} from "./client-session";
import { verifyClientUserLogin, type ClientUserRecord } from "./client-users";

export type { ClientSession } from "./client-session";
export { CLIENT_SESSION_COOKIE, decodeClientSessionToken } from "./client-session";

export async function setClientSessionCookie(session: Omit<ClientSession, "exp">): Promise<void> {
  const cookieStore = await cookies();
  const token = await encodeClientSessionToken({
    ...session,
    exp: createClientSessionExpiry(),
  });
  cookieStore.set(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CLIENT_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearClientSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CLIENT_SESSION_COOKIE);
}

export async function getClientSession(): Promise<ClientSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeClientSessionToken(token);
}

export async function requireClientSession(): Promise<ClientSession> {
  const session = await getClientSession();
  if (!session) redirect("/client/login");
  return session;
}

export function clientSessionFromRecord(user: ClientUserRecord): Omit<ClientSession, "exp"> {
  return {
    clientId: user.id,
    email: user.email,
    organizationName: user.organization_name,
    contactName: user.contact_name,
  };
}

export async function authenticateClientLogin(
  email: string,
  password: string
): Promise<Omit<ClientSession, "exp"> | null> {
  const user = await verifyClientUserLogin(email, password);
  if (!user) return null;
  return clientSessionFromRecord(user);
}
