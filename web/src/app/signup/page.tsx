import { SignupPageClient } from "@/components/auth/SignupPageClient";
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

  return <SignupPageClient account={account} destination={destination} />;
}
