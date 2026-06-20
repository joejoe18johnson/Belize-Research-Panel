"use client";

import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AUTH_CONTENT_MAX } from "@/lib/layout-widths";

export function AccountDeleteHeader({ logoHref }: { logoHref: string }) {
  return (
    <header className="safe-top shrink-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`mx-auto flex ${AUTH_CONTENT_MAX} items-center justify-between gap-3 px-4 py-4 sm:px-6`}>
        <BrpLogoLink href={logoHref} variant="light" />
        <ThemeToggle compact />
      </div>
    </header>
  );
}
