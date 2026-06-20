import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, decodeAdminSessionToken } from "@/lib/admin-session";
import { CLIENT_SESSION_COOKIE, decodeClientSessionToken } from "@/lib/client-session";
import { adminPathAllowedForSession, staffDefaultAdminPath } from "@/lib/staff-roles";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);
const PUBLIC_CLIENT_PATHS = new Set(["/client/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = token ? await decodeAdminSessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!adminPathAllowedForSession(session, pathname)) {
      const redirectUrl = new URL(staffDefaultAdminPath(session.role, session.allowedModules), request.url);
      redirectUrl.searchParams.set("access", "denied");
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/client")) {
    if (PUBLIC_CLIENT_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(CLIENT_SESSION_COOKIE)?.value;
    const session = token ? await decodeClientSessionToken(token) : null;

    if (!session) {
      const loginUrl = new URL("/client/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
