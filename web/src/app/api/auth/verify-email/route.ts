import { NextRequest, NextResponse } from "next/server";
import { verifyAccountEmail } from "@/lib/accounts";
import { resolveRequestOrigin, setSessionCookie } from "@/lib/auth";

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, resolveRequestOrigin(request)));
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const purpose = request.nextUrl.searchParams.get("purpose")?.trim() ?? "";

  if (!token) {
    return redirectTo(request, "/verify-email?error=missing");
  }

  if (purpose === "email-change") {
    return redirectTo(
      request,
      `/verify-email?token=${encodeURIComponent(token)}&purpose=email-change`
    );
  }

  try {
    const account = await verifyAccountEmail(token);
    if (!account) {
      return redirectTo(request, "/verify-email?error=expired");
    }

    await setSessionCookie(account.id);
    return redirectTo(request, "/register");
  } catch (error) {
    console.error("Email verification failed:", error);
    return redirectTo(request, "/verify-email?error=failed");
  }
}
