import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { sessionCanAccessModule } from "@/lib/staff-roles";
import {
  loadPlatformTestingSettings,
  savePlatformTestingSettings,
} from "@/lib/platform-testing-settings-store";
import { normalizePlatformTestingSettings } from "@/lib/platform-testing-settings";

export async function GET() {
  const session = await getAdminSession();
  if (!session || !sessionCanAccessModule(session, "testing")) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const settings = await loadPlatformTestingSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session || !sessionCanAccessModule(session, "testing")) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      allowDuplicateEmails: boolean;
      allowDuplicatePhones: boolean;
    }>;
    const current = await loadPlatformTestingSettings();
    const settings = await savePlatformTestingSettings(
      normalizePlatformTestingSettings({
        ...current,
        allowDuplicateEmails:
          typeof body.allowDuplicateEmails === "boolean"
            ? body.allowDuplicateEmails
            : current.allowDuplicateEmails,
        allowDuplicatePhones:
          typeof body.allowDuplicatePhones === "boolean"
            ? body.allowDuplicatePhones
            : current.allowDuplicatePhones,
      }),
      session.displayName
    );
    revalidatePath("/admin/testing");
    return NextResponse.json({ ok: true, settings });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not save testing settings." }, { status: 500 });
  }
}
