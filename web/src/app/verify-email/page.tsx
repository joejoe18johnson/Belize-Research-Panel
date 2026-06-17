import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAccountEmail } from "@/lib/accounts";
import { setSessionCookie } from "@/lib/auth";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export const metadata = {
  title: "Verify email | Belize Research Panel",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; purpose?: string }>;
}) {
  const { token, purpose } = await searchParams;

  if (!token) {
    return (
      <AuthPageShell title="Invalid verification link" subtitle="This verification link is missing or incomplete.">
        <Link href="/signup" className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
          Create account
        </Link>
      </AuthPageShell>
    );
  }

  if (purpose === "email-change") {
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

  const account = await verifyAccountEmail(token);
  if (!account) {
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

  await setSessionCookie(account.id);
  redirect("/register");
}
