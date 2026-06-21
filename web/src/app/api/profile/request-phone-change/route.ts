import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requestAccountPhoneChange } from "@/lib/accounts";
import { getSessionAccount } from "@/lib/auth";
import { sendPhoneChangeRequestedEmail } from "@/lib/email/process-emails";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session?.panelistRegistered) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      phoneCountryCode?: string;
      phoneLocalNumber?: string;
    };

    let account;
    try {
      account = await requestAccountPhoneChange(
        session.id,
        String(body.phoneCountryCode ?? "+501"),
        String(body.phoneLocalNumber ?? "")
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "invalid_phone") {
          return NextResponse.json(
            { errors: { phoneLocalNumber: "Please enter a valid phone number." } },
            { status: 400 }
          );
        }
        if (error.message === "phone_exists") {
          return NextResponse.json(
            { errors: { phoneLocalNumber: "That phone number is already registered on the panel." } },
            { status: 409 }
          );
        }
      }
      throw error;
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/account-on-hold");

    const origin = request.nextUrl.origin;
    const pendingPhone = account.pending_phone_whatsapp ?? "";
    void sendPhoneChangeRequestedEmail({
      to: session.email,
      firstName: session.firstName,
      pendingPhone,
      origin,
    });

    return NextResponse.json({
      ok: true,
      onHold: true,
      pendingPhone: account.pending_phone_whatsapp,
      message:
        "Your account is on hold until an administrator verifies your new phone number. You will be notified when it is approved.",
    });
  } catch {
    return NextResponse.json({ message: "Phone change request could not be processed." }, { status: 500 });
  }
}
