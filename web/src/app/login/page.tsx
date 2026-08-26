import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignedInBanner } from "@/components/auth/SignedInBanner";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { getSessionAccount } from "@/lib/auth";
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
  const destination = nextPath ?? "/dashboard";

  if (account?.panelistRegistered && account.emailVerified) {
    redirect("/dashboard");
  }

  return (
    <AuthPageShell
      title="Panelist login"
      subtitle="Sign in with the email and password you used when creating your account."
    >
      {verified === "1" ? (
        <BrandedAlert tone="success" title="Congratulations, your email has been verified" className="mb-6" showIcon>
          Please log in to continue with account registration.
        </BrandedAlert>
      ) : null}
      {account ? <SignedInBanner account={account} nextPath={destination} /> : null}
      <LoginForm nextPath={destination} initialEmail={initialEmail ?? ""} />
    </AuthPageShell>
  );
}
