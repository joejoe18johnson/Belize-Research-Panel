import { NextRequest, NextResponse } from "next/server";
import { issueEmailVerificationToken } from "@/lib/accounts";
import { buildVerificationUrl, getSessionAccount, resolveRequestOrigin } from "@/lib/auth";
import { sendSignupVerifyEmail } from "@/lib/email/process-emails";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session) {
      return NextResponse.json({ message: "Sign in to resend the verification email." }, { status: 401 });
    }
    if (session.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true, message: "Your email is already verified." });
    }

    const issued = await issueEmailVerificationToken(session.id);
    if (!issued.ok) {
      if (issued.reason === "already_verified") {
        return NextResponse.json({ ok: true, alreadyVerified: true, message: "Your email is already verified." });
      }
      if (issued.reason === "throttled") {
        return NextResponse.json(
          { message: "Please wait a minute before requesting another verification email." },
          { status: 429 }
        );
      }
      return NextResponse.json({ message: "Could not resend verification email." }, { status: 400 });
    }

    const origin = resolveRequestOrigin(request);
    const verifyUrl = buildVerificationUrl(issued.token, origin);
    const delivery = await sendSignupVerifyEmail({
      to: issued.account.email,
      firstName: issued.account.first_name,
      verifyUrl,
    });

    return NextResponse.json({
      ok: true,
      emailSent: delivery.sent,
      emailError: delivery.sent ? undefined : delivery.error,
      verifyUrl: delivery.sent ? undefined : verifyUrl,
      message: delivery.sent
        ? "We sent a new verification link. Check your inbox and spam folder."
        : "We could not send the email. Use the verification link on this page.",
    });
  } catch (error) {
    console.error("Resend verification failed:", error);
    return NextResponse.json({ message: "Could not resend verification email." }, { status: 500 });
  }
}
