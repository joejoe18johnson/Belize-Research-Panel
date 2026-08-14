import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Verify email",
  description: "Confirm your email address for your Belize Research Panel account.",
  path: "/verify-email",
  noIndex: true,
});

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; purpose?: string; error?: string }>;
}) {
  const { token, purpose, error } = await searchParams;

  if (token && !error && purpose !== "email-change") {
    redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  if (purpose === "email-change" && token) {
    return (
      <AuthPageShell
        title="Administrator approval required"
        subtitle="Email address changes are reviewed by our team. If you recently requested a new email, your account stays on hold until an administrator approves the change."
      >
        <Link
          href="/dashboard/account-on-hold"
          className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          View account status
        </Link>
      </AuthPageShell>
    );
  }

  if (error === "missing") {
    return (
      <AuthPageShell title="Invalid verification link" subtitle="This verification link is missing or incomplete.">
        <Link href="/signup" className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
          Create account
        </Link>
      </AuthPageShell>
    );
  }

  if (error === "expired") {
    return (
      <AuthPageShell title="Verification link expired" subtitle="This link may have already been used or is no longer valid.">
        <div className="flex flex-col gap-3">
          <Link href="/login" className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800">
            Log in
          </Link>
          <Link href="/signup" className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950">
            Create a new account
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  if (error === "failed") {
    return (
      <AuthPageShell title="Verification failed" subtitle="We could not verify your email right now. Try again or log in if you already verified.">
        <div className="flex flex-col gap-3">
          <Link href="/login" className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800">
            Log in
          </Link>
          <Link href="/signup" className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950">
            Create account
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Check your email"
      subtitle="Open the verification link we sent to your inbox to continue panelist registration."
    >
      <div className="flex flex-col gap-3">
        <Link href="/signup/check-email" className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800">
          Go to verification help
        </Link>
        <Link href="/login" className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950">
          Log in
        </Link>
      </div>
    </AuthPageShell>
  );
}
