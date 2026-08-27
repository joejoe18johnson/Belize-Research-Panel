import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, decodeAdminSessionToken } from "@/lib/admin-session";
import { CLIENT_SESSION_COOKIE, decodeClientSessionToken } from "@/lib/client-session";
import {
  DEFAULT_ROLE_MODULE_ACCESS,
  adminPathAllowedForSession,
  staffDefaultAdminPath,
} from "@/lib/staff-roles";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);
const PUBLIC_CLIENT_PATHS = new Set(["/client/login"]);
const PANELIST_SESSION_COOKIE = "brp_session";

function withPathnameHeader(request: NextRequest): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-brp-pathname", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return requestHeaders;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get(PANELIST_SESSION_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request: { headers: withPathnameHeader(request) } });
  }

  if (pathname.startsWith("/admin")) {
    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const decoded = token ? await decodeAdminSessionToken(token) : null;

    if (!decoded) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = {
      ...decoded,
      allowedModules: [...(DEFAULT_ROLE_MODULE_ACCESS[decoded.role] ?? [])],
    };

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
  matcher: ["/admin/:path*", "/client/:path*", "/dashboard/:path*"],
};
