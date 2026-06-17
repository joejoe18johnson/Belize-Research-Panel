import { AdminDataModuleDashboard } from "@/components/admin/AdminDataModuleDashboard";
import { RoleTestAccountsReference } from "@/components/admin/RoleTestAccountsReference";
import { isDemoAccountsEnabled } from "@/lib/demo-accounts";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import { buildModuleSnapshot } from "@/lib/admin-module-snapshots";
import { listStaffUsers } from "@/lib/staff-users";
import { STAFF_ROLE_LABELS, staffRoleModuleSummary } from "@/lib/staff-roles";

export const metadata = { title: "User Roles & Permissions | Admin" };

export default async function AdminUserRolesPage() {
  const hub = await loadAdminDataHub();
  const snapshot = buildModuleSnapshot("user-roles", hub);
  const staffUsers = await listStaffUsers();
  const showReference = isDemoAccountsEnabled();

  if (!snapshot) {
    return null;
  }

  const liveRoleRows = staffUsers.map((user) => ({
    role: STAFF_ROLE_LABELS[user.role],
    scope: staffRoleModuleSummary(user.role),
    modules: user.email,
    live: "Staff login",
  }));

  const snapshotWithLiveRoles = {
    ...snapshot,
    tables: snapshot.tables.map((table) =>
      table.id === "roles"
        ? {
            ...table,
            title: "Live staff accounts",
            rows: liveRoleRows.length > 0 ? liveRoleRows : table.rows,
          }
        : table
    ),
  };

  return (
    <div className="space-y-6">
      <AdminDataModuleDashboard snapshot={snapshotWithLiveRoles} />
      {showReference ? <RoleTestAccountsReference /> : null}
    </div>
  );
}
