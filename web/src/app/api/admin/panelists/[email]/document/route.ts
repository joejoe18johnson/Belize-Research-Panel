import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { findPanelistByEmail } from "@/lib/panelists";
import { loadPanelistVerificationDocument, type PanelistDocumentKind } from "@/lib/panelist-documents";
import { cleanText } from "@/lib/validation";

function parseKind(value: string): PanelistDocumentKind | null {
  if (value === "photo-id" || value === "residence-proof") return value;
  return null;
}

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
  const kind = parseKind(cleanText(searchParams.get("kind")).toLowerCase());

  if (!kind) {
    return NextResponse.json({ ok: false, message: "Invalid document kind." }, { status: 400 });
  }

  const panelist = await findPanelistByEmail(accountEmail);
  if (!panelist) {
    return NextResponse.json({ ok: false, message: "Panelist record not found." }, { status: 404 });
  }

  const document = await loadPanelistVerificationDocument(panelist, kind);
  if (!document) {
    return NextResponse.json({ ok: false, message: "Document not found on file." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(document.buffer), {
    headers: {
      "Content-Type": document.contentType,
      "Content-Disposition": `inline; filename="${document.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
