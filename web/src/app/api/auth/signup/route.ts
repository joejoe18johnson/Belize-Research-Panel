import { NextRequest, NextResponse } from "next/server";
import { createAccount } from "@/lib/accounts";
import { buildVerificationUrl, resolveRequestOrigin, setSessionCookie } from "@/lib/auth";
import { sendSignupAdminNotificationEmail, sendSignupVerifyEmail } from "@/lib/email/process-emails";
import type { SignupFormData } from "@/lib/auth-types";
import { isSignupEligible, validateSignupForm } from "@/lib/signup-validation";
import { cleanText } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupFormData;
    const errors = validateSignupForm(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (!isSignupEligible(body)) {
      return NextResponse.json(
        {
          errors: {
            submit: "You are not eligible to join the Belize Research Panel.",
          },
        },
        { status: 403 }
      );
    }

    let result;
    try {
      result = await createAccount({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        password: body.password,
        citizenshipStatus: body.citizenshipStatus,
        commonwealthCountry: body.commonwealthCountry,
        dob: body.dob,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "email_exists") {
        return NextResponse.json(
          { errors: { email: "An account with this email already exists. Try logging in instead." } },
          { status: 409 }
        );
      }
      if (error instanceof Error && error.message === "password_reused") {
        return NextResponse.json(
          {
            errors: {
              password:
                "Another account already uses this email with that password. Choose a different password so you can sign in to this new account.",
            },
          },
          { status: 409 }
        );
      }
      if (error instanceof Error && error.message === "storage_not_configured") {
        return NextResponse.json(
          {
            message:
              "Account storage is not configured on this server. The site administrator must add Supabase environment variables in the hosting dashboard.",
          },
          { status: 503 }
        );
      }
      throw error;
    }

    let emailSent = false;
    let emailError: string | undefined;
    let verifyUrl: string | undefined;

    try {
      await setSessionCookie(result.account.id);
    } catch (error) {
      console.error("Signup session cookie failed:", error);
    }

    const origin = resolveRequestOrigin(request);
    const fullName = `${result.account.first_name} ${result.account.last_name}`.trim();
    void sendSignupAdminNotificationEmail({
      name: fullName,
      email: result.account.email,
      origin,
    }).catch((error) => {
      console.error("Signup admin notification failed:", error);
    });

    try {
      verifyUrl = buildVerificationUrl(result.verificationToken, origin);
      const delivery = await sendSignupVerifyEmail({
        to: cleanText(body.email).toLowerCase() || result.account.email,
        firstName: result.account.first_name,
        verifyUrl,
      });
      emailSent = delivery.sent;
      emailError = delivery.sent ? undefined : delivery.error;
    } catch (error) {
      console.error("Signup verification email failed:", error);
      emailError = error instanceof Error ? error.message : "Verification email could not be sent.";
    }

    return NextResponse.json({
      ok: true,
      email: body.email,
      accountEmail: result.account.email,
      emailSent,
      emailError: emailSent ? undefined : emailError,
      verifyUrl: emailSent ? undefined : verifyUrl,
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json({ message: "Could not create account." }, { status: 500 });
  }
}
