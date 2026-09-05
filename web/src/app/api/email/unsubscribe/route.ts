import { NextRequest, NextResponse } from "next/server";
import { resolveRequestOrigin } from "@/lib/auth";
import { unsubscribeFromOutreachToken } from "@/lib/email/unsubscribe";

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, resolveRequestOrigin(request)));
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const result = await unsubscribeFromOutreachToken(token);
  if (!result.ok) {
    return redirectTo(request, "/unsubscribe?error=invalid");
  }
  return redirectTo(request, `/unsubscribe?done=1&token=${encodeURIComponent(token)}`);
}

export async function POST(request: NextRequest) {
  let token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      token = String(form.get("token") ?? "").trim();
    } else if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => ({}))) as { token?: string };
      token = String(body.token ?? "").trim();
    }
  }

  const result = await unsubscribeFromOutreachToken(token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: "Invalid unsubscribe link." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, already: result.already });
}
