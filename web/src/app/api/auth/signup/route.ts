import { NextRequest, NextResponse } from "next/server";
import { createAccount } from "@/lib/accounts";
import { buildVerificationUrl, resolveRequestOrigin, setSessionCookie } from "@/lib/auth";
import { sendSignupVerifyEmail } from "@/lib/email/process-emails";
import type { SignupFormData } from "@/lib/auth-types";
import { isSignupEligible, validateSignupForm } from "@/lib/signup-validation";

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

    await setSessionCookie(result.account.id);
    const origin = resolveRequestOrigin(request);
    const verifyUrl = buildVerificationUrl(result.verificationToken, origin);
    const delivery = await sendSignupVerifyEmail({
      to: result.account.email,
      firstName: result.account.first_name,
      verifyUrl,
    });

    return NextResponse.json({
      ok: true,
      email: result.account.email,
      emailSent: delivery.sent,
      emailError: delivery.sent ? undefined : delivery.error,
      verifyUrl: delivery.sent ? undefined : verifyUrl,
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json({ message: "Could not create account." }, { status: 500 });
  }
}
