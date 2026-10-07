import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardNavBadges, requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { panelistRowToDashboardProfile } from "@/lib/panelist-dashboard";
import { findPanelistByEmail } from "@/lib/panelists";
import { privateAreaMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const metadata = privateAreaMetadata("Dashboard");

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await requireRegisteredPanelistSession();
  const panelist = await findPanelistByEmail(account.email, account.id);
  if (!panelist) {
    redirect("/account/closed");
  }

  const badges = await getDashboardNavBadges(account.email, account.id);
  const verificationStatus = panelistRowToDashboardProfile(panelist).verificationStatus;

  return (
    <DashboardShell
      email={account.email}
      firstName={account.firstName}
      lastName={account.lastName}
      badges={badges}
      verificationStatus={verificationStatus}
    >
      {children}
    </DashboardShell>
  );
}
