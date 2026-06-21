import { NextRequest, NextResponse } from "next/server";
import { adminSessionFromStaffUser, setAdminSessionCookie } from "@/lib/admin-auth";
import { validateStaffPasswordResetForm } from "@/lib/password-reset-validation";
import { staffDefaultAdminPath } from "@/lib/staff-roles";
import {
  findStaffUserByPasswordResetToken,
  resetStaffUserPassword,
} from "@/lib/staff-users";
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

    const errors = validateStaffPasswordResetForm({ password, confirmPassword });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const accountForValidation = await findStaffUserByPasswordResetToken(token);
    if (!accountForValidation) {
      return NextResponse.json(
        { errors: { submit: "This password reset link is invalid or has expired." } },
        { status: 400 }
      );
    }

    const result = await resetStaffUserPassword(token, password);
    if (!result.ok) {
      return NextResponse.json({ errors: { submit: result.error } }, { status: 400 });
    }

    const session = await adminSessionFromStaffUser(result.user);
    await setAdminSessionCookie(session);

    return NextResponse.json({
      ok: true,
      redirectTo: staffDefaultAdminPath(result.user.role, session.allowedModules),
    });
  } catch {
    return NextResponse.json({ message: "Could not reset password." }, { status: 500 });
  }
}
