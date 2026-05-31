import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";

export async function GET() {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ account: null }, { status: 401 });
  }
  return NextResponse.json({ account });
}
