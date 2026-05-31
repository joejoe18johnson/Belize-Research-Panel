import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";

export const metadata = {
  title: "Registration successful | Belize Research Panel",
};

export default async function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; welcome?: string }>;
}) {
  const account = await getSessionAccount();
  const params = await searchParams;

  if (account?.panelistRegistered) {
    redirect(params.welcome === "1" ? "/dashboard?welcome=1" : "/dashboard");
  }

  redirect("/register");
}
