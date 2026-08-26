import { AdminPanelistsClient } from "@/components/admin/panelists/AdminPanelistsClient";
import { getUniqueFilterValues } from "@/lib/admin-panelists";
import { listAccounts } from "@/lib/accounts";
import { loadPanelists } from "@/lib/panelists";
import {
  loadPanelistPhotoUploadUsernames,
  loadPanelistResidenceUploadUsernames,
  requirementContextForPanelist,
} from "@/lib/panelist-requirement-context";
import { assessPanelistRequirements } from "@/lib/panelist-requirements";
import type { RequirementApprovalStatus } from "@/lib/panelist-requirements";
import { cleanText } from "@/lib/validation";

export const metadata = {
  title: "Panelists | Admin | Belize Research Panel",
};

export default async function AdminPanelistsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; verification?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const initialTab =
    params.tab === "flagged" ? "flagged" : params.tab === "duplicates" ? "duplicates" : undefined;
  const [rows, accounts, photoUploadUsernames, residenceUploadUsernames] = await Promise.all([
    loadPanelists(),
    listAccounts(),
    loadPanelistPhotoUploadUsernames(),
    loadPanelistResidenceUploadUsernames(),
  ]);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
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
      initialTab={initialTab}
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
