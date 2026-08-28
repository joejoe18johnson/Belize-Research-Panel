import { isAdminSessionActive } from "@/lib/admin-auth";
import { getSessionAccount } from "@/lib/auth";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { cleanText } from "@/lib/validation";

export async function canAccessCampaignBranding(campaignId: string): Promise<boolean> {
  if (await isAdminSessionActive()) return true;

  const account = await getSessionAccount();
  if (!account) return false;

  const email = cleanText(account.email).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  return assignments.some(
    (record) => record.id === campaignId && cleanText(record.panelistEmail ?? "").toLowerCase() === email
  );
}
