import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { createPanelistGroup, loadPanelistGroups } from "@/lib/panelist-groups";
import type { PanelistGroupType } from "@/lib/panelist-group-types";
import { normalizeSampleFilters } from "@/lib/panelist-group-resolve";
import { cleanText } from "@/lib/validation";

export async function GET() {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const groups = await loadPanelistGroups();
  return NextResponse.json({ ok: true, groups });
}

export async function POST(request: Request) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const type = cleanText(String(body.type ?? "static")) === "filter" ? "filter" : "static";
    const group = await createPanelistGroup({
      name: cleanText(String(body.name ?? "")),
      description: cleanText(String(body.description ?? "")),
      type: type as PanelistGroupType,
      emails: Array.isArray(body.emails) ? body.emails.map(String) : String(body.emails ?? ""),
      filters: normalizeSampleFilters(body.filters),
    });

    revalidatePath("/admin/groups");
    revalidatePath("/admin/campaigns/create");
    return NextResponse.json({ ok: true, group });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create group.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
