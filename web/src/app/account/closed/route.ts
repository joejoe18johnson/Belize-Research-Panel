import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

/** Ends a session whose panelist record is already gone, then opens the public homepage. */
export async function GET(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", request.url));
}
