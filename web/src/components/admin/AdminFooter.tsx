import Link from "next/link";
import { siteFooterClass, siteFooterLinkClass, siteFooterMutedClass } from "@/lib/brand";
import { formatHeadingCase } from "@/lib/sentence-case";

const COPYRIGHT_YEAR = new Date().getFullYear();

export function AdminFooter() {
  return (
    <footer className={`shrink-0 ${siteFooterClass} px-4 py-3 sm:px-6`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-[11px] leading-snug ${siteFooterMutedClass}`}>
          © {COPYRIGHT_YEAR} {formatHeadingCase("Belize Research Panel")}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium" aria-label="Legal and policy links">
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
        </nav>
      </div>
    </footer>
  );
}
