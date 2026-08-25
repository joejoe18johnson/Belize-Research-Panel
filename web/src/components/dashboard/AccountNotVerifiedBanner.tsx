import Link from "next/link";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { dashboardPrimaryButtonClass } from "@/lib/brand";
import { formatHeadingCase } from "@/lib/sentence-case";
import { isAccountVerified } from "./VerifiedCheckBadge";

export function AccountNotVerifiedBanner({ verificationStatus }: { verificationStatus: string }) {
  if (isAccountVerified(verificationStatus)) {
    return null;
  }

  return (
    <div aria-live="polite" className="min-w-0">
      <BrandedAlert tone="warning" title="Account not verified">
        <p>
          Your panelist account has not been verified yet. Our team is reviewing your registration and will notify you
          when verification is complete.
        </p>
        <p className="font-semibold">
          Current status: {verificationStatus}
        </p>
        <Link href="/dashboard/verification" className={`${dashboardPrimaryButtonClass} mt-2 w-full sm:mt-4 sm:w-auto`}>
          {formatHeadingCase("View verification progress")}
        </Link>
      </BrandedAlert>
    </div>
  );
}
