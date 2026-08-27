import { AdminRolePermissionsEditor } from "@/components/admin/AdminRolePermissionsEditor";
import { AdminUserRolesClient } from "@/components/admin/AdminUserRolesClient";
import { requireSuperAdminSession } from "@/lib/admin-auth";
import { getAllRoleDescriptions, getAllRoleModuleAccess } from "@/lib/staff-role-access";
import { listPublicStaffUsers } from "@/lib/staff-users";

export const metadata = { title: "User Roles & Permissions | Admin" };

export default async function AdminUserRolesPage() {
  const session = await requireSuperAdminSession();
  const [staffUsers, roleAccess, roleDescriptions] = await Promise.all([
    listPublicStaffUsers(),
    getAllRoleModuleAccess(),
    getAllRoleDescriptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminUserRolesClient
        users={staffUsers}
        currentStaffId={session.staffId}
        roleAccess={roleAccess}
      />
      <AdminRolePermissionsEditor initialAccess={roleAccess} initialDescriptions={roleDescriptions} />
    </div>
  );
}
