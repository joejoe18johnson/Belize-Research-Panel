import { ProfileSectionClient } from "@/components/dashboard/ProfileSectionClient";
import { DashboardPageHeader } from "@/components/dashboard/DashboardShell";
import { dashboardSectionByHref } from "@/components/dashboard/dashboard-sections";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { panelistRowToDashboardProfile } from "@/lib/panelist-dashboard";
import { profileContactFromRow, profileUpdateFormFromRow } from "@/lib/profile-update";
import { findPanelistByEmail } from "@/lib/panelists";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile | Belize Research Panel",
};

export default async function DashboardProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ emailUpdated?: string }>;
}) {
  const account = await requireRegisteredPanelistSession();
  const panelist = await findPanelistByEmail(account.email);
  if (!panelist) {
    redirect("/register");
  }

  const { emailUpdated } = await searchParams;
  const profile = panelistRowToDashboardProfile(panelist);
  const initialForm = profileUpdateFormFromRow(panelist);
  const contact = profileContactFromRow(panelist, account.email);

  const section = dashboardSectionByHref("/dashboard/profile");
  const SectionIcon = section?.icon;

  return (
    <>
      <DashboardPageHeader
        title="Profile"
        description="View and update your profile. Biographical details stay locked; email and phone changes require administrator approval."
        icon={SectionIcon ? <SectionIcon className="h-5 w-5" /> : undefined}
      />
      <ProfileSectionClient
        profile={profile}
        account={account}
        contact={contact}
        initialForm={initialForm}
        emailUpdated={emailUpdated === "1"}
      />
    </>
  );
}
