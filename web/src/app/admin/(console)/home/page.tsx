import { AdminStaffHomeClient } from "@/components/admin/AdminStaffHomeClient";
import { requireAdminSession } from "@/lib/admin-auth";
import { ADMIN_MODULE_CONTENT } from "@/lib/admin-module-content";
import { getRoleDescription } from "@/lib/staff-role-access";
import { staffQuickAccessModules } from "@/lib/staff-roles";

export const metadata = {
  title: "Staff home | Admin | Belize Research Panel",
};

export default async function AdminStaffHomePage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const session = await requireAdminSession();
  const { access } = await searchParams;
  const roleDescription = await getRoleDescription(session.role);
  const modules = staffQuickAccessModules(session.role, session.allowedModules);
  const summaries = Object.fromEntries(
    modules.map((module) => [module.slug, ADMIN_MODULE_CONTENT[module.slug]?.summary ?? ""])
  );

  return (
    <AdminStaffHomeClient
      displayName={session.displayName}
      email={session.email}
      role={session.role}
      roleDescription={roleDescription}
      modules={modules}
      summaries={summaries}
      accessDenied={access === "denied"}
    />
  );
}
