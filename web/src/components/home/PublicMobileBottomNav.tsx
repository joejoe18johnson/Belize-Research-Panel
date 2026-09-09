"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import {
  HOME_COPY,
  readStoredHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { formatSiteCase } from "@/lib/sentence-case";

/** Space reserved so fixed bottom nav does not cover page/footer content. */
export const MOBILE_BOTTOM_NAV_OFFSET = "6.25rem";

function displayCopy(text: string, locale: HomeLocale): string {
  return locale === "en" ? formatSiteCase(text) : text;
}

function HomeIcon({ active, className = "h-5 w-5" }: { active?: boolean; className?: string }) {
  if (active) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 3.2 3.8 10.2c-.3.3-.3.8 0 1.1.3.3.8.3 1.1 0L6 10.3V19c0 .6.4 1 1 1h3.5v-5.5h3V20H17c.6 0 1-.4 1-1v-8.7l1.1 1c.3.3.8.3 1.1 0 .3-.3.3-.8 0-1.1L12 3.2Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10.8 12 3.5l8.5 7.3V19a1.2 1.2 0 0 1-1.2 1.2h-4.8v-5.6H9.5v5.6H4.7A1.2 1.2 0 0 1 3.5 19v-8.2Z" />
    </svg>
  );
}

function HowItWorksIcon({ active, className = "h-5 w-5" }: { active?: boolean; className?: string }) {
  if (active) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 5.2h2.2v7.1h-2.2V7.2Zm1.1 11.1a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.2V16M12 8h.01" />
    </svg>
  );
}

function SurveysIcon({ active, className = "h-5 w-5" }: { active?: boolean; className?: string }) {
  if (active) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M7.5 3.5A2.5 2.5 0 0 0 5 6v13.2c0 .9.7 1.6 1.6 1.6h10.8c.9 0 1.6-.7 1.6-1.6V6A2.5 2.5 0 0 0 16.5 3.5h-9Zm1.2 5.2h6.6a.9.9 0 1 1 0 1.8H8.7a.9.9 0 1 1 0-1.8Zm0 3.6h6.6a.9.9 0 1 1 0 1.8H8.7a.9.9 0 1 1 0-1.8Zm0 3.6h4.2a.9.9 0 1 1 0 1.8H8.7a.9.9 0 1 1 0-1.8Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 4.5h8A2.5 2.5 0 0 1 18.5 7v12.2a1.3 1.3 0 0 1-1.3 1.3H6.8a1.3 1.3 0 0 1-1.3-1.3V7A2.5 2.5 0 0 1 8 4.5Z" />
      <path strokeLinecap="round" d="M8.8 9.2h6.4M8.8 12.5h6.4M8.8 15.8h4" />
    </svg>
  );
}

function RewardsIcon({ active, className = "h-5 w-5" }: { active?: boolean; className?: string }) {
  if (active) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2.8 13.7 7h4.7l-3.8 2.9 1.5 4.5L12 11.8 7.9 14.4 9.4 9.9 5.6 7h4.7L12 2.8Zm-7 14.4h14v1.8H5v-1.8Zm1.2 3.2h11.6V22H6.2v-1.6Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3.5 1.6 4.2h4.4l-3.5 2.7 1.3 4.2L12 12.5 8.2 14.6l1.3-4.2-3.5-2.7h4.4L12 3.5Z" />
      <path strokeLinecap="round" d="M5 17.5h14M6.5 20.5h11" />
    </svg>
  );
}

function NavItem({
  href,
  label,
  active,
  icon,
  onClick,
  emphasize,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  emphasize?: boolean;
}) {
  if (emphasize) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className="relative flex min-h-[3.25rem] flex-1 items-center justify-center px-1.5 py-1.5"
      >
        <span
          className={`inline-flex min-h-10 w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-full px-3 text-[11px] font-bold tracking-wide text-white shadow-sm transition ${
            active ? "bg-teal-800 dark:bg-teal-500" : "bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          }`}
        >
          {icon}
          <span className="leading-none">{label}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-1.5 text-[10px] font-semibold tracking-wide transition ${
        active ? "text-teal-700 dark:text-teal-300" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          active ? "bg-teal-100 text-teal-700 dark:bg-teal-900/70 dark:text-teal-200" : ""
        }`}
      >
        {icon}
      </span>
      <span className="leading-none">{label}</span>
    </Link>
  );
}

function shouldHideBottomNav(pathname: string | null, panelistRegistered: boolean): boolean {
  if (!pathname) return true;
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth")
  ) {
    return true;
  }
  // Panelist dashboard uses this bottom nav; hide for other signed-in app shells only.
  if (pathname.startsWith("/dashboard") && !panelistRegistered) return true;
  return false;
}

function scrollToHowItWorks(event: MouseEvent<HTMLAnchorElement>, pathname: string | null) {
  if (pathname !== "/") return;
  event.preventDefault();
  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PublicMobileBottomNav({
  signedIn = false,
  panelistRegistered = false,
}: {
  signedIn?: boolean;
  panelistRegistered?: boolean;
}) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<HomeLocale>("en");
  const showPanelistNav = signedIn && panelistRegistered;
  const hidden = shouldHideBottomNav(pathname, showPanelistNav);

  useEffect(() => {
    setLocale(readStoredHomeLocale());
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (hidden) {
      root.style.removeProperty("--brp-mobile-bottom-nav-offset");
      return;
    }
    root.style.setProperty("--brp-mobile-bottom-nav-offset", MOBILE_BOTTOM_NAV_OFFSET);
    return () => {
      root.style.removeProperty("--brp-mobile-bottom-nav-offset");
    };
  }, [hidden]);

  if (hidden) return null;

  const copy = HOME_COPY[locale];
  const t = (text: string) => displayCopy(text, locale);

  const isHome = showPanelistNav
    ? pathname === "/dashboard"
    : pathname === "/";
  const isSurveys = Boolean(pathname?.startsWith("/dashboard/surveys"));
  const isRewards =
    Boolean(pathname?.startsWith("/dashboard/rewards")) ||
    Boolean(pathname?.startsWith("/dashboard/payouts"));
  const isJoin =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/register");

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden"
      aria-label={t("Primary")}
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-sm items-stretch overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-950/95 dark:shadow-black/40">
        {showPanelistNav ? (
          <>
            <NavItem
              href="/dashboard"
              label={t(copy.navHome)}
              active={isHome}
              icon={<HomeIcon active={isHome} />}
            />
            <NavItem
              href="/dashboard/surveys"
              label={t(copy.navSurveys)}
              active={isSurveys}
              icon={<SurveysIcon active={isSurveys} />}
            />
            <NavItem
              href="/dashboard/rewards"
              label={t(copy.navRewards)}
              active={isRewards}
              icon={<RewardsIcon active={isRewards} />}
            />
          </>
        ) : (
          <>
            <NavItem
              href="/"
              label={t(copy.navHome)}
              active={pathname === "/"}
              icon={<HomeIcon active={pathname === "/"} />}
            />
            <NavItem
              href="/#how-it-works"
              label={t(copy.navHowItWorks)}
              active={false}
              icon={<HowItWorksIcon />}
              onClick={(event) => scrollToHowItWorks(event, pathname)}
            />
            <NavItem
              href="/register"
              label={t(signedIn ? copy.navContinue : copy.navJoinNow)}
              active={Boolean(isJoin)}
              emphasize
              icon={
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              }
            />
          </>
        )}
      </div>
    </nav>
  );
}
