import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  deletePanelistGroup,
  findPanelistGroupById,
  updatePanelistGroup,
} from "@/lib/panelist-groups";
import type { PanelistGroupType } from "@/lib/panelist-group-types";
import { normalizeSampleFilters } from "@/lib/panelist-group-resolve";
import { cleanText } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const group = await findPanelistGroupById(id);
  if (!group) {
    return NextResponse.json({ ok: false, message: "Group not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, group });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const group = await updatePanelistGroup(id, {
      name: body.name !== undefined ? cleanText(String(body.name)) : undefined,
      description: body.description !== undefined ? cleanText(String(body.description)) : undefined,
      type:
        body.type !== undefined
          ? ((cleanText(String(body.type)) === "filter" ? "filter" : "static") as PanelistGroupType)
          : undefined,
      emails:
        body.emails !== undefined
          ? Array.isArray(body.emails)
            ? body.emails.map(String)
            : String(body.emails)
          : undefined,
      filters: body.filters !== undefined ? normalizeSampleFilters(body.filters) : undefined,
    });

    revalidatePath("/admin/groups");
    revalidatePath(`/admin/groups/${id}/edit`);
    revalidatePath("/admin/campaigns/create");
    return NextResponse.json({ ok: true, group });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update group.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deletePanelistGroup(id);
    revalidatePath("/admin/groups");
    revalidatePath("/admin/campaigns/create");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete group.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
