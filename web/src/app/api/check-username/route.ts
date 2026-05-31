import { NextRequest, NextResponse } from "next/server";
import { loadPanelists, usernameExists } from "@/lib/panelists";
import { validUsername } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username") ?? "";
  if (!validUsername(username)) {
    return NextResponse.json({ taken: false });
  }
  const rows = await loadPanelists();
  return NextResponse.json({ taken: usernameExists(rows, username) });
}
