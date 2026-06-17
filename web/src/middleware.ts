import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeAdminSessionToken } from "@/lib/admin-auth";
import { adminPathAllowedForRole, staffDefaultAdminPath } from "@/lib/staff-roles";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("brp_admin_session")?.value;
  const session = token ? decodeAdminSessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!adminPathAllowedForRole(session.role, pathname)) {
    const redirectUrl = new URL(staffDefaultAdminPath(session.role), request.url);
    redirectUrl.searchParams.set("access", "denied");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
