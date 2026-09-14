"use client";

import Link from "next/link";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { useLocale, useSignupCopy } from "@/components/locale/LocaleProvider";
import { citizenshipLabelFor } from "@/lib/signup-locale";

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
  const copy = useSignupCopy();
  const locale = useLocale();
  if (!citizenshipStatus) return null;
  const statusLabel = citizenshipLabelFor(locale, citizenshipStatus);

  if (eligible) {
    if (compact) {
      return (
        <div aria-live="polite">
          <BrandedAlert tone="success" title={copy.citizenshipMetTitle} compact showIcon formatBody={false}>
            <p>{statusLabel}</p>
            <p className="mt-1">{copy.citizenshipMetBody}</p>
          </BrandedAlert>
        </div>
      );
    }

    return (
      <div className="mt-4 text-center" aria-live="polite">
        <BrandedAlert tone="success" title={copy.citizenshipMetTitle} showIcon formatBody={false} className="px-6 py-8">
          <p className="text-base font-semibold">{statusLabel}</p>
          <p className="mt-4 leading-relaxed">{copy.citizenshipMetBody}</p>
        </BrandedAlert>
      </div>
    );
  }

  if (compact) {
    return (
      <div aria-live="polite">
        <BrandedAlert tone="error" title={copy.citizenshipNotMetTitle} compact showIcon formatBody={false}>
          <p className="font-medium">{statusLabel}</p>
          <p className="mt-1">{copy.citizenshipIntro}</p>
          <Link
            href="/"
            className="mt-3 inline-flex rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            {copy.returnHome}
          </Link>
        </BrandedAlert>
      </div>
    );
  }

  return (
    <div className="mt-4 text-center" aria-live="polite">
      <BrandedAlert tone="error" title={copy.citizenshipNotMetTitle} showIcon formatBody={false} className="px-6 py-8">
        <p className="text-base font-semibold">{statusLabel}</p>
        <p className="mt-3 font-semibold leading-relaxed">{copy.citizenshipIntro}</p>
        <p className="mt-4">{copy.citizenshipNotMetBody}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {copy.returnHome}
        </Link>
      </BrandedAlert>
    </div>
  );
}
