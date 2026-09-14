"use client";

import Link from "next/link";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { useAuthCopy } from "@/components/locale/LocaleProvider";
import type { SessionAccount } from "@/lib/auth-types";
import { LogoutButton } from "./LogoutButton";

export function SignedInBanner({
  account,
  nextPath = "/register",
}: {
  account: SessionAccount;
  nextPath?: string;
}) {
  const copy = useAuthCopy();

  return (
    <div className="mb-6">
      <BrandedAlert tone="info" title={copy.signedInTitle} showIcon formatBody={false}>
        <p className="break-all">{account.email}</p>
        {!account.emailVerified ? (
          <p className="mt-2">{copy.signedInVerifyEmail}</p>
        ) : account.panelistRegistered ? (
          <p className="mt-2">{copy.signedInAlreadyRegistered}</p>
        ) : (
          <p className="mt-2">{copy.signedInContinueRegistration}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {!account.emailVerified ? (
            <Link
              href={`/signup/check-email?email=${encodeURIComponent(account.email)}&next=${encodeURIComponent(nextPath)}`}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              {copy.checkVerification}
            </Link>
          ) : account.panelistRegistered ? (
            <Link
              href={nextPath}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              {copy.continue}
            </Link>
          ) : (
            <Link
              href={nextPath}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              {copy.continueToRegistration}
            </Link>
          )}
          <LogoutButton
            label={copy.logOut}
            loadingLabel={copy.loggingOut}
            className="rounded-lg border border-teal-300 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-100"
          />
        </div>
      </BrandedAlert>
    </div>
  );
}
