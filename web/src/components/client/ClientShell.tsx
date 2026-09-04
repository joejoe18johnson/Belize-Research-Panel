"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeIconButton } from "@/components/theme/ThemeToggle";
import { BackToTopButton } from "@/components/shared/BackToTopButton";
import { portalStickyHeaderClass } from "@/lib/brand";
import type { ClientSession } from "@/lib/client-session";
import { formatHeadingCase } from "@/lib/sentence-case";

export function ClientShell({ session, children }: { session: ClientSession; children: ReactNode }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/client/logout", { method: "POST" });
    router.push("/client/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen min-w-0 w-full max-w-full overflow-x-clip bg-[linear-gradient(180deg,#f0fdfa_0%,#f4f4f5_12rem,#f4f4f5_100%)] dark:bg-[linear-gradient(180deg,#042f2e_0%,#09090b_12rem,#09090b_100%)]">
      <header className={`${portalStickyHeaderClass} shadow-sm`}>
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <BrpLogoLink href="/client" variant="light" logoClassName="sm:text-base" />
            <p className="mt-0.5 truncate text-xs font-medium text-teal-800 dark:text-teal-200">
              {session.organizationName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden text-right lg:block">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{session.contactName}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{session.email}</p>
            </div>
            <ThemeIconButton />
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-teal-200 px-3 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-100 dark:hover:bg-teal-950 sm:text-sm"
            >
              {formatHeadingCase("Log out")}
            </button>
          </div>
        </div>
        <nav className="border-t border-teal-50 bg-gradient-to-b from-white to-teal-50/30 dark:border-teal-900/40 dark:from-zinc-900 dark:to-teal-950/20">
          <div className="mx-auto flex max-w-6xl gap-2 px-4 py-2 sm:px-6">
            <Link
              href="/client"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50 dark:text-teal-100 dark:hover:bg-teal-900/40"
            >
              {formatHeadingCase("My campaigns")}
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <BackToTopButton />
    </div>
  );
}
