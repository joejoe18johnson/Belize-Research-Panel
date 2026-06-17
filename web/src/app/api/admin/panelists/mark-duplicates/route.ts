import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { markNameDobDuplicatesAsPossibleDuplicate } from "@/lib/admin-panelist-actions";

export async function POST() {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const updated = await markNameDobDuplicatesAsPossibleDuplicate();
  return NextResponse.json({
    ok: true,
    updated,
    message:
      updated > 0
        ? `${updated} record(s) marked as Possible Duplicate.`
        : "No new name + DOB duplicates to mark.",
  });
}
