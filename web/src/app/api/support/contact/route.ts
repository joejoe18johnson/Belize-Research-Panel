import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount, resolveRequestOrigin } from "@/lib/auth";
import { sendSupportContactEmails } from "@/lib/email/process-emails";
import { createSupportMessage } from "@/lib/support-messages";
import { getSupportInboxEmail, isSupportTopicId } from "@/lib/support-contact";
import { cleanText } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionAccount();
    if (!session) {
      return NextResponse.json({ message: "Please sign in to contact support." }, { status: 401 });
    }

    const body = (await request.json()) as {
      topic?: string;
      message?: string;
    };

    const name = `${session.firstName} ${session.lastName}`.trim() || session.email;
    const email = session.email.trim().toLowerCase();
    const topic = cleanText(body.topic ?? "");
    const message = cleanText(body.message ?? "");

    const errors: Record<string, string> = {};
    if (!topic) errors.topic = "Please select a topic.";
    else if (!isSupportTopicId(topic)) errors.topic = "Please select a valid topic.";
    if (!message) errors.message = "Please describe how we can help.";
    else if (message.length < 20) errors.message = "Please provide a bit more detail (at least 20 characters).";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const record = await createSupportMessage({
      name,
      email,
      topic,
      message,
      panelistEmail: session.email,
      accountId: session.id,
    });

    await sendSupportContactEmails({
      origin: resolveRequestOrigin(request),
      record: {
        id: record.id,
        name: record.name,
        email: record.email,
        topicLabel: record.topicLabel,
        message: record.message,
      },
      supportInboxEmail: getSupportInboxEmail(),
    });

    return NextResponse.json({
      ok: true,
      referenceId: record.id,
      message: `Your message has been sent. We will reply to ${record.email} within 1–2 business days.`,
    });
  } catch (error) {
    console.error("[support] contact form failed", error);
    return NextResponse.json({ message: "Could not send your message." }, { status: 500 });
  }
}
