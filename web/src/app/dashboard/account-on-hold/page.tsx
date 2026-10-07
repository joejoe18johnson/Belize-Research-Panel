import { AccountOnHoldView } from "@/components/dashboard/AccountOnHoldView";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { findPanelistByEmail } from "@/lib/panelists";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Account on hold | Belize Research Panel",
};

export default async function AccountOnHoldPage() {
  const session = await requireRegisteredPanelistSession();
  const panelist = await findPanelistByEmail(session.email, session.id);
  if (!panelist) {
    redirect("/account/closed");
  }
  if (session.accountStatus !== "on_hold") {
    redirect("/dashboard");
  }

  return <AccountOnHoldView account={session} />;
}
