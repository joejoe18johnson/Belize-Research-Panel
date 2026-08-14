import { NextRequest, NextResponse } from "next/server";
import { verifyAccountEmail } from "@/lib/accounts";
import { setSessionCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const purpose = request.nextUrl.searchParams.get("purpose")?.trim() ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?error=missing", request.url));
  }

  if (purpose === "email-change") {
    return NextResponse.redirect(new URL(`/verify-email?token=${encodeURIComponent(token)}&purpose=email-change`, request.url));
  }

  const account = await verifyAccountEmail(token);
  if (!account) {
    return NextResponse.redirect(new URL("/verify-email?error=expired", request.url));
  }

  await setSessionCookie(account.id);
  return NextResponse.redirect(new URL("/register", request.url));
}
