import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { findAccountByPasswordResetToken } from "@/lib/accounts";

export const metadata = {
  title: "Reset password | Belize Research Panel",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthPageShell title="Invalid reset link" subtitle="This password reset link is missing or incomplete.">
        <Link
          href="/forgot-password"
          className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          Request a new link
        </Link>
      </AuthPageShell>
    );
  }

  const account = await findAccountByPasswordResetToken(token);
  if (!account) {
    return (
      <AuthPageShell
        title="Reset link expired"
        subtitle="This link may have already been used or is no longer valid. Request a new password reset email."
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Request new link
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back to login
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Choose a new password"
      subtitle={`Create a new password for ${account.email}.`}
      formatTitle={false}
    >
      <ResetPasswordForm token={token} />
    </AuthPageShell>
  );
}
