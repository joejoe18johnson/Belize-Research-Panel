import type { ReactNode } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { AUTH_CONTENT_MAX } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

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
    <div className="flex min-h-screen flex-col bg-zinc-100">
      <header className="safe-top shrink-0 border-b border-zinc-200 bg-white">
        <div className={`mx-auto flex ${AUTH_CONTENT_MAX} items-center justify-center px-3 py-3 sm:px-4 sm:py-4`}>
          <BrpLogoLink href="/" variant="light" priority />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-3 py-8 sm:items-center sm:px-4 sm:py-16">
        <div className={`w-full ${AUTH_CONTENT_MAX}`}>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
            <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">{formatHeadingCase(title)}</h1>
            {subtitle ? <p className="mt-2 text-sm text-zinc-600">{formatHeadingCase(subtitle)}</p> : null}
            <div className="mt-6">{children}</div>
            {footer ? (
              <div className="mt-6 border-t border-zinc-100 pt-6 text-sm text-zinc-600">{footer}</div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
