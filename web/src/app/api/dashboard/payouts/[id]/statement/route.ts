import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { pdfResponse } from "@/lib/pdf/pdf-response";
import { resolvePayoutStatementPdf } from "@/lib/pdf/resolve-payout-statement";
import { cleanText } from "@/lib/validation";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionAccount();
  if (!session?.panelistRegistered) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const resolved = await resolvePayoutStatementPdf(id, { audience: "panelist", maskPaymentDetails: true });
  if (!resolved) {
    return NextResponse.json({ message: "Payout request not found." }, { status: 404 });
  }

  if (cleanText(resolved.email).toLowerCase() !== cleanText(session.email).toLowerCase()) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  return pdfResponse(resolved.bytes, resolved.filename, download);
}
