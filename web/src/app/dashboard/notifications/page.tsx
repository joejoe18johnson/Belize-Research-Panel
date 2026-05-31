import { DashboardNotificationsClient } from "@/components/dashboard/DashboardNotificationsClient";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { requireDashboardContext } from "@/lib/dashboard-access";

export const metadata = {
  title: "Notifications | Belize Research Panel",
};

export default async function DashboardNotificationsPage() {
  const { notifications } = await requireDashboardContext();

  return (
    <>
      <DashboardPageHeader
        title="Notifications"
        description="Updates about verification, surveys, and panel activity."
      />
      <DashboardNotificationsClient initialNotifications={notifications} />
    </>
  );
}
