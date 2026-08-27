"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeMenuToggle } from "@/components/theme/ThemeToggle";
import { dashboardPrimaryButtonClass } from "@/lib/brand";
import type { DashboardNavBadges } from "@/lib/dashboard-access";
import { formatHeadingCase } from "@/lib/sentence-case";
import {
  DASHBOARD_NAV_BADGE_KEYS,
  isDashboardNavActive,
} from "./DashboardNav";
import { DASHBOARD_NAV_SECTIONS } from "./dashboard-sections";
import { UserAvatar } from "./UserAvatar";

function MenuIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.4">
      <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function navBadgeLabel(badgeKey: keyof DashboardNavBadges | undefined, count: number): string | null {
  if (!badgeKey || count <= 0) return null;
  if (badgeKey === "newSurveys") {
    if (count === 1) return "NEW";
    return count > 9 ? "9+" : String(count);
  }
  return count > 9 ? "9+" : String(count);
}

export function DashboardAccountMenu({
  email,
  firstName,
  lastName,
  badges,
}: {
  email: string;
  firstName: string;
  lastName: string;
  badges: DashboardNavBadges;
}) {
  const pathname = usePathname();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const displayName = [firstName, lastName].filter((part) => part.trim()).join(" ").trim() || "Panelist";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    const previousBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBody;
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="relative flex h-10 shrink-0 items-center justify-center rounded-xl p-1 transition hover:bg-teal-50 dark:hover:bg-teal-900/40 sm:h-11 md:w-auto md:min-w-0 md:justify-start md:gap-2.5 md:px-1.5"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="dialog"
        aria-label={open ? "Close account menu" : "Open account menu"}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="relative">
          <UserAvatar
            firstName={firstName}
            email={email}
            className={open ? "ring-teal-600 dark:ring-teal-400" : undefined}
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-800 text-white ring-2 ring-white dark:bg-teal-500 dark:ring-zinc-900 md:hidden">
            <MenuIcon />
          </span>
        </span>
        <div className="hidden min-w-0 max-w-[11rem] text-left lg:max-w-[16rem] md:block">
          <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{displayName}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
        </div>
      </button>

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[80]">
              <button
                type="button"
                className="absolute inset-0 bg-teal-950/40 dark:bg-black/60"
                aria-label="Close account menu"
                onClick={() => setOpen(false)}
              />
              <aside
                id={menuId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${menuId}-title`}
                className="safe-top absolute inset-y-0 right-0 flex w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden border-l border-teal-100 bg-white shadow-2xl shadow-teal-950/20 dark:border-teal-900 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                      Belize Research Panel
                    </p>
                    <h2 id={`${menuId}-title`} className="mt-0.5 text-base font-bold text-teal-950 dark:text-teal-50">
                      {formatHeadingCase("Account")}
                    </h2>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-100 hover:text-teal-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-teal-200"
                    aria-label="Close account menu"
                    onClick={() => setOpen(false)}
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="mx-4 rounded-2xl border border-teal-100 bg-teal-50/70 px-3.5 py-3 dark:border-teal-900/60 dark:bg-teal-950/40">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar firstName={firstName} email={email} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-teal-950 dark:text-teal-50">{displayName}</p>
                      <p className="truncate text-sm text-teal-900/70 dark:text-teal-200/80">{email}</p>
                    </div>
                  </div>
                </div>

                <div className="px-4 pt-3">
                  <LogoutButton
                    showIcon
                    className={`${dashboardPrimaryButtonClass} w-full min-h-12 gap-2 text-base shadow-md shadow-teal-900/20`}
                  />
                </div>

                <nav
                  className="nav-scroll mt-4 min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-4"
                  aria-label="Dashboard sections"
                >
                  <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
                    {formatHeadingCase("Menu")}
                  </p>
                  <ul className="space-y-0.5">
                    {DASHBOARD_NAV_SECTIONS.map((item) => {
                      const active = isDashboardNavActive(pathname, item.href, item.exact);
                      const badgeKey = DASHBOARD_NAV_BADGE_KEYS[item.href];
                      const badgeCount = badgeKey ? badges[badgeKey] : 0;
                      const badgeText = navBadgeLabel(badgeKey, badgeCount);
                      const Icon = item.icon;

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                              active
                                ? "bg-teal-700 text-white shadow-sm"
                                : "text-teal-950 hover:bg-teal-50 dark:text-teal-50 dark:hover:bg-teal-950/50"
                            }`}
                            aria-current={active ? "page" : undefined}
                          >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="min-w-0 flex-1">{formatHeadingCase(item.label)}</span>
                            {badgeText ? (
                              <span
                                className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                                  badgeKey === "newSurveys"
                                    ? active
                                      ? "bg-amber-300 text-amber-950"
                                      : "bg-amber-500 text-white"
                                    : active
                                      ? "bg-white/20 text-white"
                                      : "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100"
                                }`}
                              >
                                {badgeText}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="shrink-0 border-t border-teal-50 px-4 py-4 dark:border-teal-900/40">
                  <ThemeMenuToggle variant="light" />
                </div>
              </aside>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
