import { NextResponse } from "next/server";
import { deleteAccountAndOptOut } from "@/lib/account-deletion";
import { clearSessionCookie, getSessionAccount } from "@/lib/auth";
import { cleanText } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ ok: false, message: "You must be logged in." }, { status: 401 });
  }

  let body: { password?: string; confirmOptOut?: boolean };
  try {
    body = (await request.json()) as { password?: string; confirmOptOut?: boolean };
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const password = cleanText(body.password ?? "");
  if (!password) {
    return NextResponse.json({ ok: false, message: "Password is required." }, { status: 400 });
  }

  if (!body.confirmOptOut) {
    return NextResponse.json(
      { ok: false, message: "Please confirm that you want to delete your account and opt out." },
      { status: 400 }
    );
  }

  const result = await deleteAccountAndOptOut(session.id, password);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
