import Link from "next/link";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { dashboardPrimaryButtonClass } from "@/lib/brand";
import { isAccountVerified } from "./VerifiedCheckBadge";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AccountNotVerifiedBanner({ verificationStatus }: { verificationStatus: string }) {
  if (isAccountVerified(verificationStatus)) {
    return null;
  }

  return (
    <div aria-live="polite">
      <BrandedAlert tone="warning" title="Account not verified">
        <p>
          {formatHeadingCase(
            "Your panelist account has not been verified yet. Our team is reviewing your registration and will notify you when verification is complete."
          )}
        </p>
        <p className="mt-2 font-semibold">
          {formatHeadingCase("Current status")}: {verificationStatus}
        </p>
        <Link
          href="/dashboard/verification"
          className={`${dashboardPrimaryButtonClass} mt-4 w-full sm:w-auto`}
        >
          {formatHeadingCase("View verification progress")}
        </Link>
      </BrandedAlert>
    </div>
  );
}
