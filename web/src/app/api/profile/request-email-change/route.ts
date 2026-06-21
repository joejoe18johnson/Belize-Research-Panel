import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requestAccountEmailChange } from "@/lib/accounts";
import { getSessionAccount } from "@/lib/auth";
import { sendEmailChangeRequestedEmail } from "@/lib/email/process-emails";
import { cleanText, validEmail } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session?.panelistRegistered) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as { newEmail?: string };
    const newEmail = cleanText(body.newEmail ?? "").toLowerCase();

    if (!newEmail) {
      return NextResponse.json({ errors: { newEmail: "New email address is required." } }, { status: 400 });
    }
    if (!validEmail(newEmail)) {
      return NextResponse.json({ errors: { newEmail: "Please enter a valid email address." } }, { status: 400 });
    }
    if (newEmail === session.email.toLowerCase()) {
      return NextResponse.json(
        { errors: { newEmail: "That is already your current email address." } },
        { status: 400 }
      );
    }

    try {
      await requestAccountEmailChange(session.id, newEmail);
    } catch (error) {
      if (error instanceof Error && error.message === "email_exists") {
        return NextResponse.json(
          { errors: { newEmail: "That email address is already in use." } },
          { status: 409 }
        );
      }
      throw error;
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/account-on-hold");

    const origin = request.nextUrl.origin;
    void sendEmailChangeRequestedEmail({
      to: session.email,
      firstName: session.firstName,
      pendingEmail: newEmail,
      origin,
    });

    return NextResponse.json({
      ok: true,
      onHold: true,
      pendingEmail: newEmail,
      message:
        "Your account is on hold until an administrator approves your new email address. You will be notified when it is approved.",
    });
  } catch {
    return NextResponse.json({ message: "Email change request could not be processed." }, { status: 500 });
  }
}
