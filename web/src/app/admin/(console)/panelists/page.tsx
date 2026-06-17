import { AdminPanelistsClient } from "@/components/admin/panelists/AdminPanelistsClient";
import { getUniqueFilterValues } from "@/lib/admin-panelists";
import { loadPanelists } from "@/lib/panelists";
import {
  loadPanelistPhotoUploadUsernames,
  loadPanelistResidenceUploadUsernames,
  requirementContextForPanelist,
} from "@/lib/panelist-requirement-context";
import { assessPanelistRequirements } from "@/lib/panelist-requirements";
import type { RequirementApprovalStatus } from "@/lib/panelist-requirements";
import { promises as fs } from "fs";
import path from "path";
import type { AccountRecord } from "@/lib/auth-types";
import { cleanText } from "@/lib/validation";

async function loadAccounts(): Promise<AccountRecord[]> {
  try {
    const content = await fs.readFile(path.join(process.cwd(), "data", "accounts.json"), "utf-8");
    const parsed = JSON.parse(content) as AccountRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Panelists | Admin | Belize Research Panel",
};

export default async function AdminPanelistsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; verification?: string }>;
}) {
  const params = await searchParams;
  const [rows, accounts, photoUploadUsernames, residenceUploadUsernames] = await Promise.all([
    loadPanelists(),
    loadAccounts(),
    loadPanelistPhotoUploadUsernames(),
    loadPanelistResidenceUploadUsernames(),
  ]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
        No panelists registered yet.
      </div>
    );
  }

  const accountsByEmail = new Map(
    accounts.map((account) => [cleanText(account.email).toLowerCase(), account] as const)
  );

  const requirementByEmail: Record<
    string,
    { email: RequirementApprovalStatus; phone: RequirementApprovalStatus; photoId: RequirementApprovalStatus }
  > = {};

  for (const row of rows) {
    const email = cleanText(row.email).toLowerCase();
    if (!email) continue;
    const context = requirementContextForPanelist(row, accountsByEmail, photoUploadUsernames);
    const requirements = assessPanelistRequirements(row, context);
    requirementByEmail[email] = {
      email: requirements.email,
      phone: requirements.phone,
      photoId: requirements.photoId,
    };
  }

  return (
    <AdminPanelistsClient
      rows={rows}
      requirementByEmail={requirementByEmail}
      initialEmail={params.email}
      initialVerification={params.verification}
      photoUploadUsernames={photoUploadUsernames}
      residenceUploadUsernames={residenceUploadUsernames}
      filterOptions={{
        verification: getUniqueFilterValues(rows, "verification_status"),
        district: getUniqueFilterValues(rows, "district"),
        constituency: getUniqueFilterValues(rows, "constituency"),
        voterStatus: getUniqueFilterValues(rows, "voter_status"),
      }}
    />
  );
}
