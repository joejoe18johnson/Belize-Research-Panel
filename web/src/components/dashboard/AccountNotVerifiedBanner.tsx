"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { dashboardPrimaryButtonClass } from "@/lib/brand";
import { formatHeadingCase } from "@/lib/sentence-case";
import { isAccountVerified } from "./VerifiedCheckBadge";

const VERIFICATION_HREF = "/dashboard/verification";
const PHONE_SECTION_HREF = "/dashboard/verification#phone";

export function AccountNotVerifiedBanner({ verificationStatus }: { verificationStatus: string }) {
  const pathname = usePathname();

  if (isAccountVerified(verificationStatus)) {
    return null;
  }

  const onVerificationPage =
    pathname === VERIFICATION_HREF || pathname.startsWith(`${VERIFICATION_HREF}/`);

  return (
    <div aria-live="polite" className="min-w-0 space-y-3">
      <BrandedAlert tone="warning" title="Account not verified" formatBody={false}>
        <p>
          Your panelist account is not fully verified yet. Confirm your phone with a WhatsApp code in Verification
          Center. Photo ID is still reviewed by the panel team.
        </p>
        <p className="font-semibold">Current status: {verificationStatus}</p>
      </BrandedAlert>
      {onVerificationPage ? (
        <a href="#phone" className={`${dashboardPrimaryButtonClass} w-full sm:w-auto`}>
          {formatHeadingCase("Confirm phone number")}
        </a>
      ) : (
        <Link href={PHONE_SECTION_HREF} className={`${dashboardPrimaryButtonClass} w-full sm:w-auto`}>
          {formatHeadingCase("View verification progress")}
        </Link>
      )}
    </div>
  );
}
