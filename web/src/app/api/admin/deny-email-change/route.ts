import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { denyAccountEmailChange, findAccountByEmail } from "@/lib/accounts";
import { resolveRequestOrigin } from "@/lib/auth";
import { sendEmailChangeDeniedEmail } from "@/lib/email/process-emails";
import { adminNotificationId, markAdminNotificationsRead } from "@/lib/admin-read-state";
import { cleanText } from "@/lib/validation";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await isAdminSessionActive()) return true;
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (!adminKey) return process.env.NODE_ENV !== "production";
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided === adminKey;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = cleanText(body.email ?? "").toLowerCase();
    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const account = await findAccountByEmail(email);
    if (!account) {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    const result = await denyAccountEmailChange(email);
    if (!result) {
      return NextResponse.json({ message: "No pending email change for this account." }, { status: 404 });
    }

    await markAdminNotificationsRead([adminNotificationId("Email change", email)]);

    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/account-on-hold");

    void sendEmailChangeDeniedEmail({
      to: email,
      firstName: account.first_name,
      currentEmail: email,
      deniedEmail: result.deniedEmail,
      origin: resolveRequestOrigin(request),
    });

    return NextResponse.json({
      ok: true,
      email,
      deniedEmail: result.deniedEmail,
      accountStatus: result.account.account_status,
    });
  } catch {
    return NextResponse.json({ message: "Email change could not be denied." }, { status: 500 });
  }
}
