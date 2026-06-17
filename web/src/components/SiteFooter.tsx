import Link from "next/link";
import { getSessionAccount } from "@/lib/auth";
import { appContentClass } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

const COPYRIGHT_YEAR = new Date().getFullYear();

export async function SiteFooter() {
  const account = await getSessionAccount();

  return (
    <footer className="safe-bottom mt-auto shrink-0 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`${appContentClass} px-4 py-6 sm:px-6 sm:py-8`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatHeadingCase("Belize Research Panel")}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              © {COPYRIGHT_YEAR} Belize Research Panel. {formatHeadingCase("All rights reserved.")}
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-teal-800 dark:text-teal-300"
            aria-label="Legal and policy links"
          >
            <Link href="/site-policy" className="transition hover:text-teal-950 hover:underline">
              {formatHeadingCase("Site policy")}
            </Link>
            <Link href="/data-use-policy" className="transition hover:text-teal-950 hover:underline">
              {formatHeadingCase("Data use policy")}
            </Link>
            {account ? (
              <Link href="/account/delete" className="transition hover:text-teal-950 hover:underline">
                {formatHeadingCase("Delete account")}
              </Link>
            ) : null}
          </nav>
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {formatHeadingCase(
            "We process personal data lawfully, fairly, and transparently in line with GDPR principles, including purpose limitation, data minimisation, accuracy, storage limitation, integrity, confidentiality, and accountability."
          )}
        </p>
      </div>
    </footer>
  );
}
