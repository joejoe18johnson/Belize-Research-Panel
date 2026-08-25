import { NextResponse } from "next/server";
import { authenticateStaffLogin, setAdminSessionCookie } from "@/lib/admin-auth";
import { resolveStaffLoginRedirect } from "@/lib/staff-roles";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; next?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password?.trim() ?? "";

  const session = await authenticateStaffLogin(email || undefined, password);
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Invalid email or password." },
      { status: 401 }
    );
  }

  await setAdminSessionCookie(session);
  return NextResponse.json({
    ok: true,
    role: session.role,
    redirectTo: resolveStaffLoginRedirect(session, body.next),
  });
}
