"use client";

import Link from "next/link";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";

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
        <div aria-live="polite">
          <BrandedAlert tone="success" title="Citizenship requirement met" compact showIcon>
            <p>{citizenshipStatus}</p>
            <p className="mt-1">
              You can continue. Proof of citizenship or residency will be required during registration.
            </p>
          </BrandedAlert>
        </div>
      );
    }

    return (
      <div className="mt-4 text-center" aria-live="polite">
        <BrandedAlert tone="success" title="Citizenship requirement met" showIcon className="px-6 py-8">
          <p className="text-base font-semibold">{citizenshipStatus}</p>
          <p className="mt-3 text-base font-semibold">You are eligible to continue registration</p>
          <p className="mt-4 leading-relaxed">
            You will be required to provide proof of citizenship or residency later in this registration.
          </p>
        </BrandedAlert>
      </div>
    );
  }

  if (compact) {
    return (
      <div aria-live="polite">
        <BrandedAlert tone="error" title="Citizenship requirement not met" compact showIcon>
          <p className="font-medium">{citizenshipStatus}</p>
          <p className="mt-1">
            Only citizens of Belize, Commonwealth citizens living in Belize, and other qualifying residents of Belize may
            join the panel. Foreign nationals living outside Belize cannot register.
          </p>
          <Link
            href="/"
            className="mt-3 inline-flex rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Return home
          </Link>
        </BrandedAlert>
      </div>
    );
  }

  return (
    <div className="mt-4 text-center" aria-live="polite">
      <BrandedAlert tone="error" title="Citizenship requirement not met" showIcon className="px-6 py-8">
        <p className="text-base font-semibold">{citizenshipStatus}</p>
        <p className="mt-3 font-semibold leading-relaxed">
          Only citizens of Belize and Commonwealth citizens living in Belize may join the panel.
        </p>
        <p className="mt-4">
          You cannot continue registration. Choose a different citizenship status or return home.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Return home
        </Link>
      </BrandedAlert>
    </div>
  );
}
