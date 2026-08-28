import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, isAdminSessionActive } from "@/lib/admin-auth";
import { resolveRequestOrigin } from "@/lib/auth";
import { sendSupportReplyEmail } from "@/lib/email/process-emails";
import { appendSupportReply, markSupportMessageRead } from "@/lib/support-messages";
import { sessionCanAccessModule } from "@/lib/staff-roles";
import { cleanText } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const session = await getAdminSession();
  if (session && !sessionCanAccessModule(session, "support-inbox")) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { id?: string; action?: string; reply?: string };
    const id = cleanText(body.id ?? "");
    const action = cleanText(body.action ?? "read") || "read";
    if (!id) {
      return NextResponse.json({ message: "Message id is required." }, { status: 400 });
    }

    if (action === "reply") {
      const reply = cleanText(body.reply ?? "");
      if (reply.length < 10) {
        return NextResponse.json({ message: "Please write a slightly longer reply (at least 10 characters)." }, { status: 400 });
      }

      const updated = await appendSupportReply({
        requestId: id,
        body: reply,
        sentBy: session?.displayName || session?.email || "Support team",
      });
      if (!updated) {
        return NextResponse.json({ message: "Support message not found." }, { status: 404 });
      }

      const emailResult = await sendSupportReplyEmail({
        origin: resolveRequestOrigin(request),
        to: updated.email,
        firstName: updated.name.split(" ")[0] ?? "there",
        topicLabel: updated.topicLabel,
        requestId: updated.id,
        replyBody: reply,
      });

      revalidatePath("/admin/support-inbox");
      revalidatePath("/admin", "layout");
      revalidatePath("/help");

      if (!emailResult.sent) {
        return NextResponse.json({
          ok: true,
          message: updated,
          warning: emailResult.error || "The reply was saved, but the email could not be sent.",
        });
      }

      return NextResponse.json({ ok: true, message: updated });
    }

    const updated = await markSupportMessageRead(id);
    if (!updated) {
      return NextResponse.json({ message: "Support message not found." }, { status: 404 });
    }

    revalidatePath("/admin/support-inbox");
    revalidatePath("/admin", "layout");
    return NextResponse.json({ ok: true, message: updated });
  } catch (error) {
    console.error("[support] admin update failed", error);
    return NextResponse.json({ message: "Could not update support message." }, { status: 500 });
  }
}
