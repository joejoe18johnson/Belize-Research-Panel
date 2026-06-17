import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { findPanelistByEmail, findPanelistUpload } from "@/lib/panelists";
import { cleanText } from "@/lib/validation";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ email: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { email } = await context.params;
  const accountEmail = decodeURIComponent(email);
  const { searchParams } = new URL(request.url);
  const kind = cleanText(searchParams.get("kind")).toLowerCase();

  if (kind !== "photo-id" && kind !== "residence-proof") {
    return NextResponse.json({ ok: false, message: "Invalid document kind." }, { status: 400 });
  }

  const panelist = await findPanelistByEmail(accountEmail);
  if (!panelist) {
    return NextResponse.json({ ok: false, message: "Panelist record not found." }, { status: 404 });
  }

  const username = cleanText(panelist.username);
  const upload = await findPanelistUpload(username, kind);
  if (!upload) {
    return NextResponse.json({ ok: false, message: "Document not found on file." }, { status: 404 });
  }

  const buffer = await readFile(upload.absolutePath);
  const ext = path.extname(upload.filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${upload.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
