import { NextRequest, NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { findActiveAuthorisedRegistrar } from "@/lib/authorised-registrars-store";
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

    const registrar = await findActiveAuthorisedRegistrar(code);
    if (!registrar) {
      return NextResponse.json({
        ok: false,
        valid: false,
        message: "This authorisation code is not recognised. Ask the authorised person for a current code.",
      });
    }

    return NextResponse.json({ ok: true, valid: true, registrarName: registrar.name });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not check that code. Please try again." }, { status: 500 });
  }
}
