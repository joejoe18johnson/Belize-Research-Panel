import { NextRequest, NextResponse } from "next/server";
import { verifyAccountPassword, toSessionAccount } from "@/lib/accounts";
import { setSessionCookie } from "@/lib/auth";
import { cleanText, validEmail } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = cleanText(body.email ?? "");
    const password = cleanText(body.password ?? "");

    const errors: Record<string, string> = {};
    if (!email) errors.email = "Email address is required.";
    else if (!validEmail(email)) errors.email = "Please enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const account = await verifyAccountPassword(email, password);
    if (!account) {
      return NextResponse.json(
        { errors: { submit: "Invalid email or password." } },
        { status: 401 }
      );
    }

    await setSessionCookie(account.id);
    return NextResponse.json({ ok: true, account: toSessionAccount(account) });
  } catch {
    return NextResponse.json({ message: "Login failed." }, { status: 500 });
  }
}
