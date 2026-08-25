import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { emailTemplateSampleDataForOrigin, isEmailTemplateId } from "@/lib/email/email-templates";
import { sendTemplateEmail } from "@/lib/email/process-emails";
import { resolveRequestOrigin } from "@/lib/auth";
import { cleanText, validEmail } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isEmailTemplateId(id)) {
    return NextResponse.json({ message: "Unknown email template." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { to?: string };
  const to = cleanText(body.to ?? session.email ?? "").toLowerCase();
  if (!to || !validEmail(to)) {
    return NextResponse.json(
      { message: "Enter a valid recipient email. Without a verified domain, use your Resend account email." },
      { status: 400 }
    );
  }

  const origin = resolveRequestOrigin(request);
  const result = await sendTemplateEmail({
    templateId: id,
    to,
    data: emailTemplateSampleDataForOrigin(id, origin),
    context: `admin-test:${id}`,
  });

  if (!result.sent) {
    return NextResponse.json(
      {
        ok: false,
        message:
          result.error ||
          "Resend did not send the email. Without a custom domain, you can only send to your Resend login email or delivered@resend.dev.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    resendId: result.resendId,
    message: `Test email sent to ${to}.`,
  });
}
