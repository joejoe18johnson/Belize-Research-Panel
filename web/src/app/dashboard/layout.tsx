import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardNavBadges, requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { findPanelistByEmail } from "@/lib/panelists";
import { panelistRowToDashboardProfile } from "@/lib/panelist-dashboard";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await requireRegisteredPanelistSession();
  const badges = await getDashboardNavBadges(account.email);
  const panelist = await findPanelistByEmail(account.email);
  const verificationStatus = panelist
    ? panelistRowToDashboardProfile(panelist).verificationStatus
    : "Pending";

  return (
    <DashboardShell
      email={account.email}
      firstName={account.firstName}
      badges={badges}
      verificationStatus={verificationStatus}
    >
      {children}
    </DashboardShell>
  );
}
