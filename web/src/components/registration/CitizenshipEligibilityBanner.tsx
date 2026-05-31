"use client";

import Link from "next/link";

interface CitizenshipEligibilityBannerProps {
  citizenshipStatus: string;
  eligible: boolean;
  compact?: boolean;
}

export function CitizenshipEligibilityBanner({
  citizenshipStatus,
  eligible,
  compact = false,
}: CitizenshipEligibilityBannerProps) {
  if (!citizenshipStatus) return null;

  if (eligible) {
    if (compact) {
      return (
        <div
          className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
          aria-live="polite"
        >
          <p className="font-medium text-emerald-800">Citizenship requirement met</p>
          <p className="mt-1 text-emerald-900">{citizenshipStatus}</p>
          <p className="mt-1 text-emerald-800/90">
            You can continue. Proof of citizenship or residency will be required during registration.
          </p>
        </div>
      );
    }

    return (
      <div
        className="mt-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-6 py-8 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-semibold text-emerald-700">Citizenship requirement met</p>
        <p className="mt-4 text-base font-semibold text-emerald-900">{citizenshipStatus}</p>
        <p className="mt-3 text-base font-semibold text-emerald-800">
          You are eligible to continue registration
        </p>
        <p className="mt-4 text-sm leading-relaxed text-emerald-800/90">
          You will be required to provide proof of citizenship or residency later in this registration.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        role="alert"
        aria-live="polite"
      >
        <p className="font-medium text-red-800">Citizenship requirement not met</p>
        <p className="mt-1 font-medium text-red-900">{citizenshipStatus}</p>
        <p className="mt-1 text-red-800">
          Only citizens of Belize and Commonwealth citizens living in Belize may join the panel.
        </p>
        <Link
          href="/"
          className="mt-3 inline-flex rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
        >
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div
      className="mt-4 rounded-2xl border-2 border-red-400 bg-red-50 px-6 py-8 text-center shadow-sm"
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-red-700">Citizenship requirement not met</p>
      <p className="mt-4 text-base font-semibold text-red-900">{citizenshipStatus}</p>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-red-800">
        Only citizens of Belize and Commonwealth citizens living in Belize may join the panel.
      </p>
      <p className="mt-4 text-sm text-red-800">
        You cannot continue registration. Choose a different citizenship status or return home.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800"
      >
        Return home
      </Link>
    </div>
  );
}
