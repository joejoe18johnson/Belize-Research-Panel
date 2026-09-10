import Link from "next/link";
import { getSessionAccount } from "@/lib/auth";
import { siteFooterClass, siteFooterLinkClass, siteFooterMutedClass } from "@/lib/brand";
import { appContentClass } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

const COPYRIGHT_YEAR = new Date().getFullYear();

export async function SiteFooter() {
  const account = await getSessionAccount();

  return (
    <footer className={`mt-auto shrink-0 ${siteFooterClass}`}>
      <div className={`${appContentClass} px-4 py-6 sm:px-6 sm:py-8`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{formatHeadingCase("Belize Research Panel")}</p>
            <p className={`mt-1 text-xs ${siteFooterMutedClass}`}>
              © {COPYRIGHT_YEAR} Belize Research Panel. {formatHeadingCase("All rights reserved.")}
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium" aria-label="Legal and policy links">
            <Link href="/help" className={siteFooterLinkClass}>
              {formatHeadingCase("Help & contact")}
            </Link>
            <Link href="/site-policy" className={siteFooterLinkClass}>
              {formatHeadingCase("Site policy")}
            </Link>
            <Link href="/data-use-policy" className={siteFooterLinkClass}>
              {formatHeadingCase("Data use policy")}
            </Link>
            <Link href="/cookie-policy" className={siteFooterLinkClass}>
              {formatHeadingCase("Cookie policy")}
            </Link>
            <Link href="/data-deletion" className={siteFooterLinkClass}>
              {formatHeadingCase("Data deletion")}
            </Link>
            {account ? (
              <Link href="/account/delete" className={siteFooterLinkClass}>
                {formatHeadingCase("Delete account")}
              </Link>
            ) : null}
          </nav>
        </div>
        <p className={`mt-4 max-w-3xl text-xs leading-relaxed ${siteFooterMutedClass}`}>
          {formatHeadingCase(
            "We process personal data lawfully, fairly, and transparently in line with GDPR principles, including purpose limitation, data minimisation, accuracy, storage limitation, integrity, confidentiality, and accountability."
          )}
        </p>
      </div>
    </footer>
  );
}
