import { findAccountById, verifyAccountPassword } from "./accounts";
import { deletePanelistRelatedData } from "./admin-panelist-delete";
import { unsubscribeClosedAccount } from "./email/unsubscribe";
import { findPanelistByEmail, loadPanelists, savePanelists } from "./panelists";
import { cleanText } from "./validation";

async function hardDeletePanelistRow(email: string): Promise<void> {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return;
  const rows = await loadPanelists();
  const next = rows.filter((row) => cleanText(row.email).toLowerCase() !== normalized);
  if (next.length === rows.length) return;
  await savePanelists(next);
}

export async function deleteAccountAndOptOut(
  accountId: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const account = await findAccountById(accountId);
  if (!account) {
    return { ok: false, error: "Account not found." };
  }

  const verified = await verifyAccountPassword(account.email, password);
  if (!verified || verified.id !== accountId) {
    return { ok: false, error: "Incorrect password." };
  }

  const panelist = await findPanelistByEmail(account.email, account.id);
  const username = panelist ? cleanText(panelist.username) : "";
  const panelistId = panelist ? cleanText(panelist.id) : "";

  // Keep only the opt-out suppression entry so this address is not contacted again.
  await unsubscribeClosedAccount(account.email);

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseCloseAccount } = await import("./supabase/repos");
    await supabaseCloseAccount({
      accountId: account.id,
      email: account.email,
      panelistId: panelistId || undefined,
      storageFolders: [account.id, cleanText(panelist?.account_id), panelistId, username],
    });
    await deletePanelistRelatedData(account.email, username, {
      accountId: account.id,
      removeAccount: false,
    });
    return { ok: true };
  }

  try {
    await hardDeletePanelistRow(account.email);
  } catch (error) {
    console.error("[account-delete] could not remove the panelist row", error);
  }

  await deletePanelistRelatedData(account.email, username, {
    accountId: account.id,
    removeAccount: "by-id",
  });

  return { ok: true };
}
