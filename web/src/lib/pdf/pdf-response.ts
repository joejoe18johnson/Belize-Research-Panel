import { NextResponse } from "next/server";

export function pdfResponse(bytes: Uint8Array, filename: string, download = false): NextResponse {
  const safeName = filename.replace(/[^\w.-]+/g, "-");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
