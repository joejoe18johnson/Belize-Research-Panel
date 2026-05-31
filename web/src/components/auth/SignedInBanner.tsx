import Link from "next/link";
import type { SessionAccount } from "@/lib/auth-types";
import { LogoutButton } from "./LogoutButton";

export function SignedInBanner({
  account,
  nextPath = "/register",
}: {
  account: SessionAccount;
  nextPath?: string;
}) {
  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
      <p className="font-medium">You are already signed in</p>
      <p className="mt-1 break-all text-teal-900">{account.email}</p>
      {!account.emailVerified ? (
        <p className="mt-2 text-teal-800">Verify your email before completing panelist registration.</p>
      ) : account.panelistRegistered ? (
        <p className="mt-2 text-teal-800">You have already completed panelist registration.</p>
      ) : (
        <p className="mt-2 text-teal-800">You can continue to panelist registration.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {!account.emailVerified ? (
          <Link
            href={`/signup/check-email?email=${encodeURIComponent(account.email)}&next=${encodeURIComponent(nextPath)}`}
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Check verification
          </Link>
        ) : account.panelistRegistered ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Go to dashboard
          </Link>
        ) : (
          <Link
            href={nextPath}
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Continue to registration
          </Link>
        )}
        <LogoutButton className="rounded-lg border border-teal-300 bg-white px-4 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100" />
      </div>
    </div>
  );
}
