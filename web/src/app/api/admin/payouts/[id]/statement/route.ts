import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sessionCanAccessModule } from "@/lib/staff-roles";
import { pdfResponse } from "@/lib/pdf/pdf-response";
import { resolvePayoutStatementPdf } from "@/lib/pdf/resolve-payout-statement";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!sessionCanAccessModule(session, "payouts")) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  const { id } = await context.params;
  const resolved = await resolvePayoutStatementPdf(id, { audience: "admin", maskPaymentDetails: false });
  if (!resolved) {
    return NextResponse.json({ message: "Payout request not found." }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  return pdfResponse(resolved.bytes, resolved.filename, download);
}
