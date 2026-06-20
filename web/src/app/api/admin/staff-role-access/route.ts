import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSuperAdminSession } from "@/lib/admin-auth";
import {
  getAllRoleDescriptions,
  getAllRoleModuleAccess,
  resetRoleAccess,
  saveRoleAccess,
} from "@/lib/staff-role-access";
import { isStaffRole } from "@/lib/staff-roles";
import { cleanText } from "@/lib/validation";

export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const [access, descriptions] = await Promise.all([getAllRoleModuleAccess(), getAllRoleDescriptions()]);
  return NextResponse.json({ ok: true, access, descriptions });
}

export async function PATCH(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const roleValue = cleanText(String(body.role ?? ""));

    if (!isStaffRole(roleValue)) {
      return NextResponse.json({ ok: false, message: "Select a valid staff role." }, { status: 400 });
    }

    if (body.reset === true) {
      const access = await resetRoleAccess(roleValue);
      revalidatePath("/admin/user-roles");
      revalidatePath("/admin", "layout");
      return NextResponse.json({ ok: true, access });
    }

    const modules = Array.isArray(body.modules)
      ? body.modules.map((slug) => cleanText(String(slug))).filter(Boolean)
      : undefined;
    const description = body.description !== undefined ? String(body.description) : undefined;

    if (modules === undefined && description === undefined) {
      return NextResponse.json({ ok: false, message: "No permission changes provided." }, { status: 400 });
    }

    const access = await saveRoleAccess(roleValue, { modules, description });
    revalidatePath("/admin/user-roles");
    revalidatePath("/admin", "layout");
    return NextResponse.json({ ok: true, access });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save role permissions.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
