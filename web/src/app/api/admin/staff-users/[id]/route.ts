import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/admin-auth";
import { deleteStaffUser, findStaffUserById, toPublicStaffUser, updateStaffUser } from "@/lib/staff-users";
import { isStaffRole } from "@/lib/staff-roles";
import { cleanText } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const user = await findStaffUserById(id);
  if (!user) {
    return NextResponse.json({ ok: false, message: "Staff account not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user: toPublicStaffUser(user) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    if (id === session.staffId && body.status === "inactive") {
      return NextResponse.json({ ok: false, message: "You cannot deactivate your own account." }, { status: 400 });
    }

    const roleValue = body.role !== undefined ? cleanText(String(body.role)) : undefined;
    if (roleValue !== undefined && !isStaffRole(roleValue)) {
      return NextResponse.json({ ok: false, message: "Select a valid staff role." }, { status: 400 });
    }

    if (id === session.staffId && roleValue && roleValue !== "super_admin") {
      return NextResponse.json({ ok: false, message: "You cannot change your own role." }, { status: 400 });
    }

    const user = await updateStaffUser(id, {
      firstName: body.firstName !== undefined ? cleanText(String(body.firstName)) : undefined,
      lastName: body.lastName !== undefined ? cleanText(String(body.lastName)) : undefined,
      role: roleValue,
      status: body.status === "inactive" ? "inactive" : body.status === "active" ? "active" : undefined,
      password: body.password !== undefined ? String(body.password) : undefined,
    });

    revalidatePath("/admin/user-roles");
    return NextResponse.json({ ok: true, user: toPublicStaffUser(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update staff account.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    if (id === session.staffId) {
      return NextResponse.json({ ok: false, message: "You cannot delete your own account." }, { status: 400 });
    }

    await deleteStaffUser(id);
    revalidatePath("/admin/user-roles");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete staff account.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
