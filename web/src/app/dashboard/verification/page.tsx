import { DashboardVerificationSection } from "@/components/dashboard/DashboardVerificationSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { buildVerificationCenterSummary } from "@/lib/panelist-verification";
import { findPanelistByEmail } from "@/lib/panelists";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Verification Center | Belize Research Panel",
};

export default async function DashboardVerificationPage() {
  const { account } = await requireDashboardContext();
  const panelist = await findPanelistByEmail(account.email);
  if (!panelist) {
    redirect("/register");
  }

  const summary = await buildVerificationCenterSummary(panelist, account);

  return (
    <>
      <DashboardPageHeader
        title="Verification Center"
        description="Track the essential items our team reviews before your account is verified."
      />
      <DashboardVerificationSection summary={summary} />
    </>
  );
}
