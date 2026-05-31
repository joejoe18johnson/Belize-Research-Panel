import Link from "next/link";
import type { ReactNode } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { appContentClass } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

export function PolicyPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-100">
      <header className="safe-top shrink-0 border-b border-zinc-200 bg-white">
        <div className={`${appContentClass} flex items-center justify-between gap-4 px-4 py-4 sm:px-6`}>
          <BrpLogoLink href="/" variant="light" />
          <Link
            href="/"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-900 hover:underline"
          >
            {formatHeadingCase("Back to home")}
          </Link>
        </div>
      </header>
      <main className={`${appContentClass} flex-1 px-4 py-8 sm:px-6 sm:py-12`}>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{formatHeadingCase(title)}</h1>
          <p className="mt-2 text-sm text-zinc-600">{formatHeadingCase(description)}</p>
          <div className="policy-prose mt-8 space-y-8 text-sm leading-relaxed text-zinc-700">{children}</div>
        </article>
      </main>
    </div>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900">{formatHeadingCase(title)}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
