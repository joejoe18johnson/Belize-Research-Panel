import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { lookupAuthorisedCode } from "@/lib/authorised-registrars-store";
import { cleanText } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const session = await getSessionAccount();
  if (!session) {
    return NextResponse.json({ ok: false, message: "You must be logged in." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { code?: string };
    const code = cleanText(body.code);
    if (!code) {
      return NextResponse.json({ ok: false, message: "Please enter the authorised verification code." }, { status: 400 });
    }

    const lookup = await lookupAuthorisedCode(code);
    if (lookup.status === "used") {
      return NextResponse.json({
        ok: false,
        valid: false,
        message: "This authorisation code has already been used. Ask for a new unused code.",
      });
    }
    if (lookup.status === "inactive") {
      return NextResponse.json({
        ok: false,
        valid: false,
        message: "This authorisation code is no longer active. Ask for a new unused code.",
      });
    }
    if (lookup.status !== "valid") {
      return NextResponse.json({
        ok: false,
        valid: false,
        message: "This authorisation code is not recognised. Ask the authorised person for a current code.",
      });
    }

    return NextResponse.json({ ok: true, valid: true, registrarName: lookup.registrar.name });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not check that code. Please try again." }, { status: 500 });
  }
}
