import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Registration successful",
  description: "Your Belize Research Panel registration is complete.",
  path: "/register/success",
  noIndex: true,
});

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
