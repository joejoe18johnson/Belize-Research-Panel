import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignedInBanner } from "@/components/auth/SignedInBanner";
import { SignupForm } from "@/components/auth/SignupForm";
import { getSessionAccount } from "@/lib/auth";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Create account",
  description:
    "Join the Belize Research Panel — create your account, verify your email, and complete registration to start earning rewards.",
  path: "/signup",
});

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
      subtitle="Confirm eligibility, then create your account with Facebook or email. Prefer WhatsApp or social contact if you do not use email."
    >
      {account ? <SignedInBanner account={account} nextPath={destination} /> : null}
      <SignupForm nextPath={destination} />
    </AuthPageShell>
  );
}
