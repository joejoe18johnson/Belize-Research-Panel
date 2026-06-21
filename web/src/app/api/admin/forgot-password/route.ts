import { NextRequest, NextResponse } from "next/server";
import { buildStaffPasswordResetUrl } from "@/lib/auth";
import { sendStaffPasswordResetEmail } from "@/lib/email/process-emails";
import { createStaffPasswordResetToken } from "@/lib/staff-users";
import { cleanText, validEmail } from "@/lib/validation";

const GENERIC_MESSAGE =
  "If an active staff account exists for that email address, we sent a password reset link. Check your inbox and spam folder.";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = cleanText(body.email ?? "").toLowerCase();

    if (!email) {
      return NextResponse.json({ errors: { email: "Staff email is required." } }, { status: 400 });
    }
    if (!validEmail(email)) {
      return NextResponse.json({ errors: { email: "Please enter a valid email address." } }, { status: 400 });
    }

    const result = await createStaffPasswordResetToken(email);
    if (result) {
      const origin = request.nextUrl.origin;
      void sendStaffPasswordResetEmail({
        to: result.user.email,
        firstName: result.user.first_name,
        resetUrl: buildStaffPasswordResetUrl(result.resetToken, origin),
        origin,
      });
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch {
    return NextResponse.json({ message: "Could not process password reset request." }, { status: 500 });
  }
}
