import Link from "next/link";
import type { ReactNode } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { appContentClass } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

export function PolicyPageShell({
  title,
  description,
  children,
  plainContent = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  plainContent?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-100 dark:bg-zinc-950">
      <header className="safe-top shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className={`${appContentClass} flex items-center justify-between gap-4 px-4 py-4 sm:px-6`}>
          <BrpLogoLink href="/" variant="light" />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-sm font-semibold text-teal-700 transition hover:text-teal-900 dark:text-teal-300 hover:underline dark:hover:text-teal-100"
            >
              {formatHeadingCase("Back to home")}
            </Link>
            <ThemeToggle compact />
          </div>
        </div>
      </header>
      <main className={`${appContentClass} flex-1 px-4 py-8 sm:px-6 sm:py-12`}>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {formatHeadingCase(title)}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(description)}</p>
          <div className={plainContent ? "mt-8" : "policy-prose mt-8 space-y-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"}>
            {children}
          </div>
        </article>
      </main>
    </div>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatHeadingCase(title)}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
