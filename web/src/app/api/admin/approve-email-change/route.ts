import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  approveAccountEmailChange,
  findAccountByEmail,
  getPendingEmailForApproval,
} from "@/lib/accounts";
import { resolveRequestOrigin } from "@/lib/auth";
import { sendEmailChangeApprovedEmail } from "@/lib/email/process-emails";
import { updatePanelistEmail } from "@/lib/panelists";
import { adminNotificationId, markAdminNotificationsRead } from "@/lib/admin-read-state";
import { cleanText } from "@/lib/validation";

async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await isAdminSessionActive()) return true;
  const adminKey = process.env.ADMIN_API_KEY?.trim();
  if (!adminKey) return process.env.NODE_ENV !== "production";
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided === adminKey;
}

function holdStatusLabel(status: string | undefined): string {
  return status === "on_hold" ? "still on hold for another pending item" : "active again";
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = cleanText(body.email ?? "").toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, message: "Email is required." }, { status: 400 });
    }

    const account = await findAccountByEmail(email);
    if (!account) {
      return NextResponse.json({ ok: false, message: "Account not found." }, { status: 404 });
    }

    const pendingEmail = await getPendingEmailForApproval(email);
    if (!pendingEmail) {
      return NextResponse.json(
        { ok: false, message: "There is no pending email change for this account." },
        { status: 404 }
      );
    }

    const result = await approveAccountEmailChange(email);
    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "This email change could not be approved. The new address may already belong to another account.",
        },
        { status: 409 }
      );
    }

    let panelistMoved = false;
    let panelistNote =
      "No panelist profile was linked to the old address, so only the login email was changed.";
    try {
      panelistMoved = await updatePanelistEmail(result.previousEmail, pendingEmail);
      if (panelistMoved) {
        panelistNote = "Their surveys and profile now use the new address.";
      }
    } catch (error) {
      console.error("[approve-email-change] panelist retarget failed", error);
      panelistNote =
        error instanceof Error
          ? `The login email was updated, but the panelist profile could not be moved (${error.message}). Open the panelist record and set the email to ${pendingEmail}.`
          : `The login email was updated, but the panelist profile could not be moved. Open the panelist record and set the email to ${pendingEmail}.`;
    }

    await markAdminNotificationsRead([adminNotificationId("Email change", email)]);

    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/account-on-hold");
    revalidatePath("/login");

    const mail = await sendEmailChangeApprovedEmail({
      to: pendingEmail,
      firstName: account.first_name,
      newEmail: pendingEmail,
      origin: resolveRequestOrigin(request),
    });

    const accountStatus = result.account.account_status;
    const mailNote = mail.sent
      ? `A confirmation email was sent to ${pendingEmail}.`
      : `The login email was updated, but the confirmation email could not be sent${
          mail.error ? ` (${mail.error})` : ""
        }.`;
    const message = `Login email updated from ${result.previousEmail} to ${pendingEmail}. They should sign in with the new address. The account is ${holdStatusLabel(
      accountStatus
    )}. ${panelistNote} ${mailNote}`;

    return NextResponse.json({
      ok: true,
      previousEmail: result.previousEmail,
      email: pendingEmail,
      accountStatus,
      panelistMoved,
      emailSent: mail.sent,
      message,
    });
  } catch (error) {
    console.error("[approve-email-change]", error);
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json(
      {
        ok: false,
        message:
          detail === "duplicate_key" || detail.toLowerCase().includes("already")
            ? "The new email is already in use, so this change could not be approved."
            : "The email change could not be approved. Try again.",
      },
      { status: 500 }
    );
  }
}
