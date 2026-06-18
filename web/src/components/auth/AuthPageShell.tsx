import type { ReactNode } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AUTH_CONTENT_MAX } from "@/lib/layout-widths";
import { formatHeadingCase, formatSiteCase } from "@/lib/sentence-case";

export function AuthPageShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#f0fdfa_0%,#f4f4f5_14rem,#f4f4f5_100%)] dark:bg-[linear-gradient(180deg,#042f2e_0%,#09090b_14rem,#09090b_100%)]">
      <header className="safe-top shrink-0 border-b border-teal-100 bg-white/95 shadow-sm shadow-teal-950/5 backdrop-blur-sm dark:border-teal-900/50 dark:bg-zinc-900/95 dark:shadow-black/20">
        <div className="h-1 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-900" aria-hidden />
        <div className={`mx-auto flex ${AUTH_CONTENT_MAX} items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4`}>
          <BrpLogoLink href="/" variant="light" />
          <ThemeToggle compact />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-3 py-8 sm:items-center sm:px-4 sm:py-16">
        <div className={`w-full ${AUTH_CONTENT_MAX}`}>
          <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm shadow-teal-950/[0.04] dark:border-teal-900/50 dark:bg-zinc-900 dark:shadow-black/20 sm:p-8">
            <h1 className="text-xl font-bold text-teal-950 dark:text-teal-100 sm:text-2xl">{formatSiteCase(title)}</h1>
            {subtitle ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{formatSiteCase(subtitle)}</p> : null}
            <div className="mt-6">{children}</div>
            {footer ? (
              <div className="mt-6 border-t border-zinc-100 pt-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
