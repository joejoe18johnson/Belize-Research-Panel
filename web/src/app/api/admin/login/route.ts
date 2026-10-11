import { NextResponse } from "next/server";
import { authenticateStaffLogin, setAdminSessionCookie } from "@/lib/admin-auth";
import { resolveStaffLoginRedirect } from "@/lib/staff-roles";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; next?: string };
    const email = body.email?.trim() ?? "";
    const password = body.password?.trim() ?? "";

    const session = await authenticateStaffLogin(email, password);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    console.error("[admin/login]", message);
    const missingEnv = /missing NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE/i.test(message);
    const websocket = /websocket/i.test(message);
    return NextResponse.json(
      {
        ok: false,
        message: "Unable to sign in right now. Please try again.",
        reason: missingEnv ? "supabase_env" : websocket ? "websocket" : "server_error",
      },
      { status: 500 }
    );
  }
}
