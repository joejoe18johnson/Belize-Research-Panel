import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  applyAdminPanelistFilters,
  panelistsToCsv,
} from "@/lib/admin-panelists";
import { loadPanelists } from "@/lib/panelists";

export async function GET(request: Request) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = {
    verification: url.searchParams.getAll("verification"),
    district: url.searchParams.getAll("district"),
    constituency: url.searchParams.getAll("constituency"),
    voterStatus: url.searchParams.getAll("voterStatus"),
  };

  const rows = await loadPanelists();
  const filtered = applyAdminPanelistFilters(rows, filters);

  return new NextResponse(panelistsToCsv(filtered), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="filtered_panelists.csv"',
    },
  });
}
