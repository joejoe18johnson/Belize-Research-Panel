import { buildDuplicateNameDobKeyCounts, isDuplicateNameDobMatch } from "./admin-panelists";
import { findAccountByEmail, putAccountOnHoldForFraudReview, releaseAccountFromFraudReview } from "./accounts";
import { sendPanelistOnHoldEmail } from "./email/process-emails";
import { unsubscribeClosedAccount } from "./email/unsubscribe";
import { findPanelistByEmail, loadPanelists, savePanelists, updatePanelistAdminFields } from "./panelists";
import { getSiteUrl } from "./seo/site-config";
import { cleanText } from "./validation";
import { deletePanelistRelatedData } from "./admin-panelist-delete";

async function notifyFraudHold(email: string): Promise<void> {
  const account = await findAccountByEmail(email);
  if (!account) return;
  await sendPanelistOnHoldEmail({
    to: account.email,
    firstName: account.first_name,
    reason: "Your registration is under review because it may match another panelist.",
    origin: getSiteUrl(),
  });
}

/** MVP Admin / Fraud Prevention: mark all name+DOB duplicate clusters as Possible Duplicate. */
export async function markNameDobDuplicatesAsPossibleDuplicate(): Promise<number> {
  const rows = await loadPanelists();
  const keyCounts = buildDuplicateNameDobKeyCounts(rows);

  let updated = 0;
  const emailsToHold: string[] = [];
  const next = rows.map((row) => {
    if (!isDuplicateNameDobMatch(row, keyCounts)) return row;
    if (cleanText(row.verification_status) === "Possible Duplicate") return row;
    updated += 1;
    const email = cleanText(row.email).toLowerCase();
    if (email) emailsToHold.push(email);
    return { ...row, verification_status: "Possible Duplicate" };
  });

  if (updated > 0) {
    await savePanelists(next);
    await Promise.all(
      emailsToHold.map(async (email) => {
        const applied = await putAccountOnHoldForFraudReview(email);
        if (applied) await notifyFraudHold(email);
      })
    );
  }
  return updated;
}

export async function flagPanelistAsPossibleDuplicate(email: string): Promise<boolean> {
  const updated = await updatePanelistAdminFields(email, { verification_status: "Possible Duplicate" });
  if (!updated) return false;
  const applied = await putAccountOnHoldForFraudReview(email);
  if (applied) await notifyFraudHold(email);
  return true;
}

export async function syncAccountHoldForVerificationStatus(
  email: string,
  verificationStatus: string
): Promise<void> {
  if (cleanText(verificationStatus) === "Possible Duplicate") {
    const applied = await putAccountOnHoldForFraudReview(email);
    if (applied) await notifyFraudHold(email);
    return;
  }
  await releaseAccountFromFraudReview(email);
}

export async function deletePanelistByEmail(email: string): Promise<boolean> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return false;

  const [panelist, account] = await Promise.all([
    findPanelistByEmail(normalized),
    findAccountByEmail(normalized),
  ]);
  if (!panelist && !account) return false;

  await unsubscribeClosedAccount(normalized);

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const {
      supabaseDeleteAccountByEmail,
      supabaseDeletePanelistByEmail,
      supabaseDeletePanelistStorage,
    } = await import("./supabase/repos");

    if (account?.id) {
      try {
        await supabaseDeletePanelistStorage(account.id);
      } catch (error) {
        console.error("Panelist storage delete failed:", error);
      }
    }

    if (panelist) {
      await supabaseDeletePanelistByEmail(normalized);
    }
    if (account) {
      await supabaseDeleteAccountByEmail(normalized);
    }

    await deletePanelistRelatedData(normalized, cleanText(panelist?.username ?? ""));
    return true;
  }

  await deletePanelistRelatedData(normalized, cleanText(panelist?.username ?? ""));
  if (panelist) {
    const rows = await loadPanelists();
    await savePanelists(rows.filter((row) => cleanText(row.email).toLowerCase() !== normalized));
  }
  return true;
}
