import { duplicateNameDobKey } from "./admin-panelists";
import { putAccountOnHoldForFraudReview, releaseAccountFromFraudReview } from "./accounts";
import { loadPanelists, savePanelists, updatePanelistAdminFields } from "./panelists";
import { cleanText } from "./validation";
import { deletePanelistRelatedData } from "./admin-panelist-delete";

/** MVP Admin / Fraud Prevention: mark all name+DOB duplicate clusters as Possible Duplicate. */
export async function markNameDobDuplicatesAsPossibleDuplicate(): Promise<number> {
  const rows = await loadPanelists();
  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key.replace(/\|/g, "").trim()) continue;
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  let updated = 0;
  const emailsToHold: string[] = [];
  const next = rows.map((row) => {
    const key = duplicateNameDobKey(row);
    if ((keyCounts.get(key) ?? 0) <= 1) return row;
    if (cleanText(row.verification_status) === "Possible Duplicate") return row;
    updated += 1;
    const email = cleanText(row.email).toLowerCase();
    if (email) emailsToHold.push(email);
    return { ...row, verification_status: "Possible Duplicate" };
  });

  if (updated > 0) {
    await savePanelists(next);
    await Promise.all(emailsToHold.map((email) => putAccountOnHoldForFraudReview(email)));
  }
  return updated;
}

export async function flagPanelistAsPossibleDuplicate(email: string): Promise<boolean> {
  const updated = await updatePanelistAdminFields(email, { verification_status: "Possible Duplicate" });
  if (!updated) return false;
  await putAccountOnHoldForFraudReview(email);
  return true;
}

export async function syncAccountHoldForVerificationStatus(
  email: string,
  verificationStatus: string
): Promise<void> {
  if (cleanText(verificationStatus) === "Possible Duplicate") {
    await putAccountOnHoldForFraudReview(email);
    return;
  }
  await releaseAccountFromFraudReview(email);
}

export async function deletePanelistByEmail(email: string): Promise<boolean> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return false;

  const rows = await loadPanelists();
  const index = rows.findIndex((row) => cleanText(row.email).toLowerCase() === normalized);
  if (index < 0) return false;

  const row = rows[index];
  await deletePanelistRelatedData(normalized, cleanText(row.username));

  const next = rows.filter((_, i) => i !== index);
  await savePanelists(next);
  return true;
}
