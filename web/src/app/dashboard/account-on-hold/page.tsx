import { AccountOnHoldView } from "@/components/dashboard/AccountOnHoldView";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Account on hold | Belize Research Panel",
};

export default async function AccountOnHoldPage() {
  const session = await requireRegisteredPanelistSession();
  if (session.accountStatus !== "on_hold") {
    redirect("/dashboard");
  }

  return <AccountOnHoldView account={session} />;
}
