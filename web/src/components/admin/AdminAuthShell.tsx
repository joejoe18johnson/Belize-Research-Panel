"use client";

import Link from "next/link";
import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { formatHeadingCase } from "@/lib/sentence-case";
import type { ReactNode } from "react";

export const adminAuthCardClassName =
  "rounded-2xl border border-white/10 bg-white/95 p-6 text-zinc-900 shadow-xl dark:border-zinc-700/50 dark:bg-zinc-900/95 dark:text-zinc-100 sm:p-8";

export const adminAuthInputClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export function AdminAuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-teal-950 via-teal-900 to-zinc-900 text-white">
      <header className="safe-top px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <BrpLogoLink href="/" variant="dark" />
          <ThemeToggle variant="dark" compact />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:px-6">
        <div className="w-full max-w-2xl">
          <div className={adminAuthCardClassName}>
            <p className="text-xs font-semibold tracking-[0.14em] text-teal-700 dark:text-teal-300">
              {formatHeadingCase(eyebrow)}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-teal-950 dark:text-teal-100">{formatHeadingCase(title)}</h1>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
            ) : null}
            <div className="mt-6">{children}</div>
            <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/admin/login" className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-300">
                ← Back to staff login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
