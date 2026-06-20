import { PanelistGroupFormClient } from "@/components/admin/panelist-groups/PanelistGroupFormClient";
import { loadPanelists } from "@/lib/panelists";

export const metadata = { title: "Create Group | Admin" };

export default async function AdminCreatePanelistGroupPage() {
  const panelists = await loadPanelists();
  return <PanelistGroupFormClient panelists={panelists} />;
}
