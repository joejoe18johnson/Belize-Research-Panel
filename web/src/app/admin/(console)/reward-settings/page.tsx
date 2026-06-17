import { AdminRewardSettingsClient } from "@/components/admin/campaigns/AdminRewardSettingsClient";
import { loadRewardSettings } from "@/lib/reward-settings-store";

export const metadata = {
  title: "Reward Settings | Admin",
};

export default async function AdminRewardSettingsPage() {
  const settings = await loadRewardSettings();
  return <AdminRewardSettingsClient initialSettings={settings} />;
}
