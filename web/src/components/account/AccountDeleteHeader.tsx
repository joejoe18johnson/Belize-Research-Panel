"use client";

import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeIconButton } from "@/components/theme/ThemeToggle";
import { AUTH_CONTENT_MAX } from "@/lib/layout-widths";

export function AccountDeleteHeader({ logoHref }: { logoHref: string }) {
  return (
    <header className="safe-top min-w-0 w-full max-w-full shrink-0 overflow-x-clip border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`mx-auto ${AUTH_CONTENT_MAX} px-4 sm:px-6`}>
        <div className="flex items-center justify-between gap-3 py-4">
          <BrpLogoLink href={logoHref} variant="light" />
          <ThemeIconButton />
        </div>
      </div>
    </header>
  );
}
