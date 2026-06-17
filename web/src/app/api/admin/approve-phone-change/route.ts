import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  approveAccountPhoneChange,
  findAccountByEmail,
  getPendingPhoneForApproval,
} from "@/lib/accounts";
import { updatePanelistPhone } from "@/lib/panelists";
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

    const pendingPhone = await getPendingPhoneForApproval(email);
    if (!pendingPhone) {
      return NextResponse.json({ message: "No pending phone change for this account." }, { status: 404 });
    }

    const updated = await updatePanelistPhone(email, pendingPhone);
    if (!updated) {
      return NextResponse.json({ message: "Panelist record not found." }, { status: 404 });
    }

    const cleared = await approveAccountPhoneChange(email);
    if (!cleared) {
      return NextResponse.json({ message: "Could not clear phone change request." }, { status: 500 });
    }

    await markAdminNotificationsRead([adminNotificationId("Phone change", email)]);

    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/account-on-hold");

    return NextResponse.json({
      ok: true,
      email,
      phone: pendingPhone,
      accountStatus: cleared.account_status,
    });
  } catch {
    return NextResponse.json({ message: "Phone change could not be approved." }, { status: 500 });
  }
}
