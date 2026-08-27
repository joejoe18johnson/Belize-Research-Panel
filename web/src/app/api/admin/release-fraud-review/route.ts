import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { findAccountByEmail, releaseAccountFromFraudReview } from "@/lib/accounts";
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

    const released = await releaseAccountFromFraudReview(email);
    if (!released) {
      return NextResponse.json({ message: "This account is not on hold for duplicate review." }, { status: 404 });
    }

    await markAdminNotificationsRead([adminNotificationId("Duplicate review", email)]);

    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/account-on-hold");

    return NextResponse.json({
      ok: true,
      email,
      message: `Duplicate-review hold released for ${email}. The account is active again unless another hold is pending.`,
    });
  } catch {
    return NextResponse.json({ message: "Could not release this account hold." }, { status: 500 });
  }
}
