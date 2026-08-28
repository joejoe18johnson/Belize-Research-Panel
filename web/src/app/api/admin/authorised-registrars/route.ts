import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createAuthorisedRegistrar,
  deleteAuthorisedRegistrar,
  loadAuthorisedRegistrars,
  setAuthorisedRegistrarActive,
} from "@/lib/authorised-registrars-store";
import { cleanText } from "@/lib/validation";

function persistFailureMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "storage_not_configured" || /EROFS|read-only file system/i.test(message)) {
    return "Could not save authorisation codes on the live site. They have to be stored in the database, not a local file.";
  }
  return message || fallback;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const store = await loadAuthorisedRegistrars();
  return NextResponse.json({ ok: true, registrars: store.registrars });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await createAuthorisedRegistrar({
      name: String(body.name ?? ""),
      code: String(body.code ?? ""),
      notes: String(body.notes ?? ""),
      createdBy: session.displayName,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }
    revalidatePath("/admin/authorised-registrars");
    return NextResponse.json({ ok: true, registrar: result.registrar });
  } catch (error) {
    console.error("Create authorised registrar failed:", error);
    return NextResponse.json(
      { ok: false, message: persistFailureMessage(error, "Could not create the authorisation code.") },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = cleanText(String(body.id ?? ""));
    if (!id) {
      return NextResponse.json({ ok: false, message: "Missing registrar id." }, { status: 400 });
    }
    const updated = await setAuthorisedRegistrarActive(id, Boolean(body.active));
    if (!updated) {
      return NextResponse.json({ ok: false, message: "Authorised person not found." }, { status: 404 });
    }
    revalidatePath("/admin/authorised-registrars");
    return NextResponse.json({ ok: true, registrar: updated });
  } catch (error) {
    console.error("Update authorised registrar failed:", error);
    return NextResponse.json(
      { ok: false, message: persistFailureMessage(error, "Could not update the authorisation code.") },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = cleanText(String(body.id ?? ""));
    if (!id) {
      return NextResponse.json({ ok: false, message: "Missing registrar id." }, { status: 400 });
    }
    const deleted = await deleteAuthorisedRegistrar(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, message: "Authorised person not found." }, { status: 404 });
    }
    revalidatePath("/admin/authorised-registrars");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete authorised registrar failed:", error);
    return NextResponse.json(
      { ok: false, message: persistFailureMessage(error, "Could not delete the authorisation code.") },
      { status: 500 }
    );
  }
}
