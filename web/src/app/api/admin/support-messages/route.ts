import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { markSupportMessageRead } from "@/lib/support-messages";
import { cleanText } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: string };
    const id = cleanText(body.id ?? "");
    if (!id) {
      return NextResponse.json({ message: "Message id is required." }, { status: 400 });
    }

    const updated = await markSupportMessageRead(id);
    if (!updated) {
      return NextResponse.json({ message: "Support message not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: updated });
  } catch {
    return NextResponse.json({ message: "Could not update support message." }, { status: 500 });
  }
}
