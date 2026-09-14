import { LoginPageClient } from "@/components/auth/LoginPageClient";
import { getSessionAccount } from "@/lib/auth";
import { safeAppNextPath } from "@/lib/login-redirect";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const metadata = buildPageMetadata({
  title: "Log in",
  description:
    "Sign in to your Belize Research Panel account to take surveys, track rewards, and manage your panelist profile.",
  path: "/login",
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string; verified?: string }>;
}) {
  const { next: nextPath, email: initialEmail, verified } = await searchParams;
  const account = await getSessionAccount();
  const destination = safeAppNextPath(nextPath, "/dashboard");

  if (account?.panelistRegistered && account.emailVerified) {
    if (account.accountStatus === "on_hold") {
      redirect("/dashboard/account-on-hold");
    }
    redirect(destination);
  }

  return (
    <LoginPageClient
      account={account}
      destination={destination}
      initialEmail={initialEmail ?? ""}
      verified={verified === "1"}
    />
  );
}
