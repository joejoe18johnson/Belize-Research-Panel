import { NextResponse } from "next/server";
import { deleteAccountAndOptOut } from "@/lib/account-deletion";
import { clearSessionCookie, getSessionAccount } from "@/lib/auth";
import { sendAccountDeletedEmail } from "@/lib/email/process-emails";
import { cleanText } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ ok: false, message: "You must be logged in." }, { status: 401 });
  }

  let body: { password?: string; confirmOptOut?: boolean };
  try {
    body = (await request.json()) as { password?: string; confirmOptOut?: boolean };
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const password = cleanText(body.password ?? "");
  if (!password) {
    return NextResponse.json({ ok: false, message: "Password is required." }, { status: 400 });
  }

  if (!body.confirmOptOut) {
    return NextResponse.json(
      { ok: false, message: "Please confirm that you want to delete your account and opt out." },
      { status: 400 }
    );
  }

  const deleteEmail = session.email;
  const deleteFirstName = session.firstName;

  try {
    const result = await deleteAccountAndOptOut(session.id, password);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("[account-delete] failed", error);
    return NextResponse.json(
      { ok: false, message: "Could not delete your account. Please try again." },
      { status: 500 }
    );
  }

  await clearSessionCookie();
  void sendAccountDeletedEmail({
    to: deleteEmail,
    firstName: deleteFirstName,
  })
    .catch((error) => {
      console.error("[account-delete] confirmation email failed", error);
    })
    .finally(async () => {
      // Confirmation mail may write a log row; wipe that personal record too.
      try {
        const { removeOutboundMessagesForEmail } = await import("@/lib/admin-panelist-delete");
        await removeOutboundMessagesForEmail(deleteEmail);
      } catch (error) {
        console.error("[account-delete] could not clear outbound message log", error);
      }
      try {
        const { useSupabase } = await import("@/lib/supabase/data-source");
        if (useSupabase()) {
          const { supabaseWipeOutboundMessagesForEmail } = await import("@/lib/supabase/repos");
          await supabaseWipeOutboundMessagesForEmail(deleteEmail);
        }
      } catch (error) {
        console.error("[account-delete] could not clear outbound message rows", error);
      }
    });

  return NextResponse.json({ ok: true, redirect: "/" });
}
