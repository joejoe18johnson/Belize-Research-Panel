import { AdminTestingSettingsClient } from "@/components/admin/platform/AdminTestingSettingsClient";
import { requireAdminPathAccess } from "@/lib/admin-auth";
import { loadPlatformTestingSettings } from "@/lib/platform-testing-settings-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Testing | Admin",
};

export default async function AdminTestingPage() {
  await requireAdminPathAccess("/admin/testing");
  const settings = await loadPlatformTestingSettings();
  return <AdminTestingSettingsClient initialSettings={settings} />;
}
