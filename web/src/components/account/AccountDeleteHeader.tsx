"use client";

import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeMenuToggle, ThemeSwitch } from "@/components/theme/ThemeToggle";
import { AUTH_CONTENT_MAX } from "@/lib/layout-widths";

export function AccountDeleteHeader({ logoHref }: { logoHref: string }) {
  return (
    <header className="safe-top shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`mx-auto ${AUTH_CONTENT_MAX} px-4 sm:px-6`}>
        <div className="flex items-center justify-between gap-3 py-4">
          <BrpLogoLink href={logoHref} variant="light" />
          <ThemeSwitch compact className="hidden sm:inline-flex" />
        </div>
        <div className="border-t border-zinc-200 py-2 dark:border-zinc-800 sm:hidden">
          <ThemeMenuToggle variant="light" />
        </div>
      </div>
    </header>
  );
}
