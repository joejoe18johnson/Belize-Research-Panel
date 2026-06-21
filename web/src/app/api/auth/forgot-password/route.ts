import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/accounts";
import { buildPasswordResetUrl } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email/process-emails";
import { cleanText, validEmail } from "@/lib/validation";

const GENERIC_MESSAGE =
  "If an account exists for that email address, we sent a password reset link. Check your inbox and spam folder.";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = cleanText(body.email ?? "").toLowerCase();

    if (!email) {
      return NextResponse.json({ errors: { email: "Email address is required." } }, { status: 400 });
    }
    if (!validEmail(email)) {
      return NextResponse.json({ errors: { email: "Please enter a valid email address." } }, { status: 400 });
    }

    const result = await createPasswordResetToken(email);
    if (result) {
      const origin = request.nextUrl.origin;
      void sendPasswordResetEmail({
        to: result.account.email,
        firstName: result.account.first_name,
        resetUrl: buildPasswordResetUrl(result.resetToken, origin),
      });
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch {
    return NextResponse.json({ message: "Could not process password reset request." }, { status: 500 });
  }
}
