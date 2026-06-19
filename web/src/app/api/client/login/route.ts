import { NextResponse } from "next/server";
import { authenticateClientLogin, setClientSessionCookie } from "@/lib/client-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password?.trim() ?? "";

  const session = await authenticateClientLogin(email, password);
  if (!session) {
    return NextResponse.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
  }

  await setClientSessionCookie(session);
  return NextResponse.json({ ok: true, redirectTo: "/client" });
}
