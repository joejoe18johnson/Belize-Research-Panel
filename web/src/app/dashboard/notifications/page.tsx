import { DashboardNotificationsClient } from "@/components/dashboard/DashboardNotificationsClient";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireDashboardContext } from "@/lib/dashboard-access";

export const metadata = {
  title: "Notifications | Belize Research Panel",
};

export default async function DashboardNotificationsPage() {
  const { notifications } = await requireDashboardContext();

  const section = dashboardSectionByHref("/dashboard/notifications");
  const SectionIcon = section?.icon;

  return (
    <>
      <DashboardPageHeader
        title="Notifications"
        description="Updates about verification, surveys, and panel activity."
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
      />
      <DashboardNotificationsClient initialNotifications={notifications} />
    </>
  );
}
