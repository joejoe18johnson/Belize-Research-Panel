import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignedInBanner } from "@/components/auth/SignedInBanner";
import { SignupForm } from "@/components/auth/SignupForm";
import { getSessionAccount } from "@/lib/auth";

export const metadata = {
  title: "Create account | Belize Research Panel",
  description: "Create your Belize Research Panel account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextPath } = await searchParams;
  const account = await getSessionAccount();
  const destination = nextPath ?? "/register";

  return (
    <AuthPageShell
      title="Create your account"
      subtitle="First confirm your eligibility, then create your account and verify your email before completing panelist registration."
    >
      {account ? <SignedInBanner account={account} nextPath={destination} /> : null}
      <SignupForm nextPath={destination} />
    </AuthPageShell>
  );
}
