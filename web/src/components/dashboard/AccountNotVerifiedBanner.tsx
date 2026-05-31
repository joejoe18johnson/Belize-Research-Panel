import Link from "next/link";
import { isAccountVerified } from "./VerifiedCheckBadge";
import { formatHeadingCase } from "@/lib/sentence-case";

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      />
    </svg>
  );
}

export function AccountNotVerifiedBanner({ verificationStatus }: { verificationStatus: string }) {
  if (isAccountVerified(verificationStatus)) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border-2 border-red-400 bg-red-50 px-4 py-4 shadow-sm sm:px-5 sm:py-5"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertIcon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-red-900 sm:text-lg">{formatHeadingCase("Account not verified")}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-red-800">
            {formatHeadingCase(
              "Your panelist account has not been verified yet. Our team is reviewing your registration and will notify you when verification is complete."
            )}
          </p>
          <p className="mt-2 text-sm font-semibold text-red-900">
            {formatHeadingCase("Current status")}: {verificationStatus}
          </p>
          <Link
            href="/dashboard/verification"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 sm:w-auto"
          >
            {formatHeadingCase("View verification progress")}
          </Link>
        </div>
      </div>
    </div>
  );
}
