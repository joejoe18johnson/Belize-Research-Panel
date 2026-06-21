import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSuperAdminSession } from "@/lib/admin-auth";
import { sendStaffWelcomeEmail } from "@/lib/email/process-emails";
import { createStaffUser, listPublicStaffUsers } from "@/lib/staff-users";
import { STAFF_ROLE_LABELS, isStaffRole } from "@/lib/staff-roles";
import { cleanText } from "@/lib/validation";

export async function GET() {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const users = await listPublicStaffUsers();
  return NextResponse.json({ ok: true, users });
}

export async function POST(request: Request) {
  const session = await getSuperAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const role = cleanText(String(body.role ?? ""));
    if (!isStaffRole(role)) {
      return NextResponse.json({ ok: false, message: "Select a valid staff role." }, { status: 400 });
    }

    const user = await createStaffUser({
      email: cleanText(String(body.email ?? "")),
      firstName: cleanText(String(body.firstName ?? "")),
      lastName: cleanText(String(body.lastName ?? "")),
      role,
      password: String(body.password ?? ""),
      status: body.status === "inactive" ? "inactive" : "active",
    });

    revalidatePath("/admin/user-roles");

    void sendStaffWelcomeEmail({
      to: user.email,
      firstName: user.first_name,
      roleLabel: STAFF_ROLE_LABELS[user.role] ?? user.role,
      origin: new URL(request.url).origin,
    });

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create staff account.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
