import { AdminPanelistsClient } from "@/components/admin/panelists/AdminPanelistsClient";
import { getUniqueFilterValues } from "@/lib/admin-panelists";
import { loadPanelists } from "@/lib/panelists";

export const metadata = {
  title: "Panelists | Admin | Belize Research Panel",
};

export default async function AdminPanelistsPage() {
  const rows = await loadPanelists();

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        No panelists registered yet.
      </div>
    );
  }

  return (
    <AdminPanelistsClient
      rows={rows}
      filterOptions={{
        verification: getUniqueFilterValues(rows, "verification_status"),
        district: getUniqueFilterValues(rows, "district"),
        constituency: getUniqueFilterValues(rows, "constituency"),
        voterStatus: getUniqueFilterValues(rows, "voter_status"),
      }}
    />
  );
}
