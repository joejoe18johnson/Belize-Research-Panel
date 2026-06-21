import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { isEmailTemplateId, renderEmailTemplate } from "@/lib/email/email-templates";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!isEmailTemplateId(id)) {
    return NextResponse.json({ message: "Unknown email template." }, { status: 404 });
  }

  const rendered = renderEmailTemplate(id);
  return new NextResponse(rendered.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
