import Link from "next/link";
import { appContentClass } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

const COPYRIGHT_YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="safe-bottom mt-auto shrink-0 border-t border-zinc-200 bg-white">
      <div className={`${appContentClass} px-4 py-6 sm:px-6 sm:py-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{formatHeadingCase("Belize Research Panel")}</p>
            <p className="mt-1 text-xs text-zinc-500">
              © {COPYRIGHT_YEAR} Belize Research Panel. {formatHeadingCase("All rights reserved.")}
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-teal-800"
            aria-label="Legal and policy links"
          >
            <Link href="/site-policy" className="transition hover:text-teal-950 hover:underline">
              {formatHeadingCase("Site policy")}
            </Link>
            <Link href="/data-use-policy" className="transition hover:text-teal-950 hover:underline">
              {formatHeadingCase("Data use policy")}
            </Link>
            <Link href="/account/delete" className="transition hover:text-teal-950 hover:underline">
              {formatHeadingCase("Delete account")}
            </Link>
          </nav>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-zinc-500">
          {formatHeadingCase(
            "We process personal data lawfully, fairly, and transparently in line with GDPR principles, including purpose limitation, data minimisation, accuracy, storage limitation, integrity, confidentiality, and accountability."
          )}
        </p>
      </div>
    </footer>
  );
}
