import Link from "next/link";
import { formatHeadingCase } from "@/lib/sentence-case";

const COPYRIGHT_YEAR = new Date().getFullYear();

export function AdminFooter() {
  return (
    <footer className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
          © {COPYRIGHT_YEAR} {formatHeadingCase("Belize Research Panel")}
        </p>
        <nav
          className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-teal-800 dark:text-teal-200"
          aria-label="Legal and policy links"
        >
          <Link href="/site-policy" className="transition hover:text-teal-950 dark:text-teal-100 hover:underline">
            {formatHeadingCase("Site policy")}
          </Link>
          <Link href="/data-use-policy" className="transition hover:text-teal-950 dark:text-teal-100 hover:underline">
            {formatHeadingCase("Data use policy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
