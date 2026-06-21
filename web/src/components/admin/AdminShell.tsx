"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import type { AdminSession } from "@/lib/admin-auth";
import {
  ADMIN_NAV_SECTIONS,
  getAdminModulesBySection,
  type AdminModule,
} from "@/lib/admin-modules";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AdminNavIcon } from "@/components/admin/AdminNavIcons";
import type { AdminNavBadges } from "@/lib/admin-nav-badges";
import { STAFF_ROLE_LABELS, sessionCanAccessModule, staffAccessibleModules } from "@/lib/staff-roles";
import { formatHeadingCase } from "@/lib/sentence-case";

function AdminNavNotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white"
      aria-label={`${count} pending`}
    >
      {label}
    </span>
  );
}

function moduleHref(module: AdminModule): string {
  if (module.href) return module.href;
  return `/admin/modules/${module.slug}`;
}

function isModuleActive(pathname: string, module: AdminModule): boolean {
  if (module.href) {
    if (pathname === module.href) return true;
    if (module.href === "/admin/campaigns") {
      return pathname === "/admin/campaigns" || (pathname.startsWith("/admin/campaigns/") && pathname !== "/admin/campaigns/create");
    }
    if (module.href === "/admin/payouts") {
      return pathname === "/admin/payouts" || pathname.startsWith("/admin/payouts/");
    }
    if (module.href === "/admin/templates") {
      return pathname === "/admin/templates" || pathname.startsWith("/admin/templates/");
    }
    return pathname.startsWith(`${module.href}/`);
  }
  return pathname === `/admin/modules/${module.slug}`;
}

function AdminMobileMenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-teal-200 bg-white text-teal-900 shadow-sm transition hover:bg-teal-50 lg:hidden dark:border-teal-800 dark:bg-zinc-900 dark:text-teal-100 dark:hover:bg-teal-950"
      aria-expanded={open}
      aria-controls="admin-mobile-nav"
      aria-label={open ? "Close admin menu" : "Open admin menu"}
    >
      {open ? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

export function AdminShell({
  children,
  session,
  navBadges = {},
}: {
  children: ReactNode;
  session: AdminSession;
  navBadges?: AdminNavBadges;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const accessibleModules = staffAccessibleModules(session.role, session.allowedModules);
  const accessibleSlugs = new Set(accessibleModules.map((module) => module.slug));

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  const navContent = (
    <>
      <div className="shrink-0 border-b border-white/10 px-4 py-4">
        <BrpLogoLink href="/admin/dashboard" variant="dark" className="block" />
        <p className="mt-2 text-xs font-medium tracking-[0.14em] text-teal-200/90">
          {formatHeadingCase("Admin console")}
        </p>
        <p className="mt-2 rounded-lg bg-white/10 px-2.5 py-2 text-xs text-teal-50">
          <span className="font-semibold">{session.displayName}</span>
          <span className="mt-0.5 block text-teal-200/90">{STAFF_ROLE_LABELS[session.role]}</span>
        </p>
      </div>
      <nav
        className="nav-scroll min-h-0 flex-1 overflow-y-auto px-2 py-3 lg:py-4"
        aria-label="Admin modules"
      >
        <div className="space-y-5">
          {ADMIN_NAV_SECTIONS.map((section) => {
            const modules = getAdminModulesBySection(section.id).filter((module) =>
              accessibleSlugs.has(module.slug)
            );
            if (modules.length === 0) return null;

            return (
              <div key={section.id}>
                <p className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.16em] text-teal-300/80">
                  {formatHeadingCase(section.label)}
                </p>
                <ul className="space-y-0.5">
                  {modules.map((module) => {
                    if (!sessionCanAccessModule(session, module.slug)) return null;
                    const active = isModuleActive(pathname, module);
                    const href = moduleHref(module);
                    const external = Boolean(module.externalHref);
                    const pendingCount = navBadges[module.slug] ?? 0;

                    return (
                      <li key={module.slug} className={module.parentSlug ? "pl-4" : undefined}>
                        <Link
                          href={href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                            module.parentSlug ? "py-2" : ""
                          } ${
                            active
                              ? "bg-teal-700 text-white shadow-sm"
                              : "text-teal-50/90 hover:bg-white/10 hover:text-white"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <AdminNavIcon module={module} />
                          <span className={`min-w-0 flex-1 leading-snug ${module.parentSlug ? "text-[13px]" : ""}`}>
                            {module.label}
                          </span>
                          <AdminNavNotificationBadge count={pendingCount} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>
      <div className="shrink-0 border-t border-white/10 px-4 py-4">
        <Link href="/" className="block text-sm text-teal-100/80 transition hover:text-white">
          ← Public site
        </Link>
        <form action="/api/admin/logout" method="post" className="mt-2">
          <button
            type="submit"
            className="text-sm font-medium text-amber-200 transition hover:text-amber-100"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[linear-gradient(180deg,#f0fdfa_0%,#f4f4f5_10rem,#f4f4f5_100%)] dark:bg-[linear-gradient(180deg,#042f2e_0%,#09090b_10rem,#09090b_100%)]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Close admin menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <aside
          id="admin-mobile-nav"
          className={`safe-top z-50 flex w-[min(100vw-2rem,18rem)] shrink-0 flex-col border-teal-100 bg-teal-950 text-white dark:border-teal-900/60 lg:static lg:z-auto lg:h-full lg:w-72 lg:border-b-0 lg:border-r ${
            mobileNavOpen
              ? "fixed inset-y-0 left-0 border-r shadow-2xl"
              : "hidden lg:flex"
          }`}
        >
          <div className="h-1 shrink-0 bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-400 lg:hidden" aria-hidden />
          {navContent}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden">
          <header className="safe-top shrink-0 border-b border-teal-100 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-teal-900/50 dark:bg-zinc-900/90 sm:px-6 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <AdminMobileMenuButton open={mobileNavOpen} onToggle={() => setMobileNavOpen((open) => !open)} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    Belize Research Panel
                  </p>
                  <p className="mt-1 hidden text-sm text-zinc-600 dark:text-zinc-400 sm:block">
                    Registration, sample selection, and panel management for public opinion polling, market research, and
                    governance studies.
                  </p>
                </div>
              </div>
              <ThemeToggle compact className="shrink-0" />
            </div>
          </header>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8">
            {children}
          </main>
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}
