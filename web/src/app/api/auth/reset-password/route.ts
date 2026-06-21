import { NextRequest, NextResponse } from "next/server";
import {
  findAccountByPasswordResetToken,
  resetAccountPassword,
  toSessionAccount,
} from "@/lib/accounts";
import { setSessionCookie } from "@/lib/auth";
import { validatePasswordResetForm } from "@/lib/password-reset-validation";
import { cleanText } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };
    const token = cleanText(body.token ?? "");
    const password = String(body.password ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");

    if (!token) {
      return NextResponse.json({ errors: { submit: "Reset link is invalid or missing." } }, { status: 400 });
    }

    const accountForValidation = await findAccountByPasswordResetToken(token);
    const errors = validatePasswordResetForm({
      password,
      confirmPassword,
      firstName: accountForValidation?.first_name,
      lastName: accountForValidation?.last_name,
      email: accountForValidation?.email,
    });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const result = await resetAccountPassword(token, password);
    if (!result.ok) {
      return NextResponse.json({ errors: { submit: result.error } }, { status: 400 });
    }

    await setSessionCookie(result.account.id);
    return NextResponse.json({
      ok: true,
      account: toSessionAccount(result.account),
    });
  } catch {
    return NextResponse.json({ message: "Could not reset password." }, { status: 500 });
  }
}
