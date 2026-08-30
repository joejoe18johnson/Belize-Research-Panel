import { NextResponse } from "next/server";

export function pdfResponse(bytes: Uint8Array, filename: string, download = false): NextResponse {
  const safeName = filename.replace(/[^\w.-]+/g, "-");
  const body = Uint8Array.from(bytes);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function pdfGenerationErrorResponse(error: unknown, context: string): NextResponse {
  console.error(`[pdf] ${context} failed`, error);
  return NextResponse.json({ message: "Could not create this PDF. Please try again." }, { status: 500 });
}
