import Link from "next/link";
import { AuthPageShell } from "./AuthPageShell";

export function RegisterAuthGate({ nextPath = "/register" }: { nextPath?: string }) {
  return (
    <AuthPageShell
      title="Panelist registration"
      subtitle="Create an account and verify your email before completing the registration form. Eligibility is checked when you sign up."
    >
      <div className="space-y-5 text-sm text-zinc-700 dark:text-zinc-300">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Confirm your citizenship and age eligibility.</li>
          <li>Create an account with your name, email, and password.</li>
          <li>Verify your email address.</li>
          <li>Complete the panelist registration form.</li>
        </ol>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="rounded-xl bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            Create account
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="rounded-xl border border-zinc-300 px-5 py-3 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            Log in to existing account
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
