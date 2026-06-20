import { AdminPanelistGroupsClient } from "@/components/admin/panelist-groups/AdminPanelistGroupsClient";
import { loadPanelistGroups } from "@/lib/panelist-groups";
import { loadPanelists } from "@/lib/panelists";

export const metadata = { title: "Groups | Admin" };

export default async function AdminPanelistGroupsPage() {
  const [groups, panelists] = await Promise.all([loadPanelistGroups(), loadPanelists()]);
  return <AdminPanelistGroupsClient groups={groups} panelists={panelists} />;
}
