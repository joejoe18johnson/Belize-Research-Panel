import { DashboardVerificationSection } from "@/components/dashboard/DashboardVerificationSection";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireDashboardContext } from "@/lib/dashboard-access";
import { buildVerificationCenterSummary } from "@/lib/panelist-verification";
import { findPanelistByEmail } from "@/lib/panelists";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Verification Center | Belize Research Panel",
};

export default async function DashboardVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const { account } = await requireDashboardContext();
  const panelist = await findPanelistByEmail(account.email);
  if (!panelist) {
    redirect("/account/closed");
  }

  const summary = await buildVerificationCenterSummary(panelist, account);

  const section = dashboardSectionByHref("/dashboard/verification");
  const SectionIcon = section?.icon;

  return (
    <>
      <DashboardPageHeader
        title="Verification Center"
        description="Confirm your phone and track the items needed before your account is verified."
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
      />
      <DashboardVerificationSection summary={summary} welcome={welcome === "1"} />
    </>
  );
}
