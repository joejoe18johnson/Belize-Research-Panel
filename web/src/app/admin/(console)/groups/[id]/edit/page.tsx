import { notFound } from "next/navigation";
import { PanelistGroupFormClient } from "@/components/admin/panelist-groups/PanelistGroupFormClient";
import { findPanelistGroupById } from "@/lib/panelist-groups";
import { loadPanelists } from "@/lib/panelists";

export const metadata = { title: "Edit Group | Admin" };

export default async function AdminEditPanelistGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [group, panelists] = await Promise.all([findPanelistGroupById(id), loadPanelists()]);
  if (!group) notFound();
  return <PanelistGroupFormClient panelists={panelists} group={group} />;
}
