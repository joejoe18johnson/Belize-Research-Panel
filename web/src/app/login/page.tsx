import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignedInBanner } from "@/components/auth/SignedInBanner";
import { getSessionAccount } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Log in | Belize Research Panel",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const { next: nextPath, email: initialEmail } = await searchParams;
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
      {account ? <SignedInBanner account={account} nextPath={destination} /> : null}
      <LoginForm nextPath={destination} initialEmail={initialEmail ?? ""} />
    </AuthPageShell>
  );
}
