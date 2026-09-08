"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HOME_COPY,
  readStoredHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { formatSiteCase } from "@/lib/sentence-case";

function displayCopy(text: string, locale: HomeLocale): string {
  return locale === "en" ? formatSiteCase(text) : text;
}

function HomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function InfoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function HelpIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5a2.5 2.5 0 1 1 3.8 2.1c-.7.4-1.3.9-1.3 1.9M12 17h.01" />
    </svg>
  );
}

function ProfileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function shouldHideBottomNav(pathname: string | null): boolean {
  if (!pathname) return true;
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth")
  );
}

export function PublicMobileBottomNav({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const [locale, setLocale] = useState<HomeLocale>("en");
  const hidden = shouldHideBottomNav(pathname);

  useEffect(() => {
    setLocale(readStoredHomeLocale());
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (hidden) {
      root.style.removeProperty("--brp-mobile-bottom-nav-offset");
      return;
    }
    root.style.setProperty("--brp-mobile-bottom-nav-offset", "4.75rem");
    return () => {
      root.style.removeProperty("--brp-mobile-bottom-nav-offset");
    };
  }, [hidden]);

  if (hidden) return null;

  const copy = HOME_COPY[locale];
  const t = (text: string) => displayCopy(text, locale);
  const isHome = pathname === "/";
  const isHelp = pathname.startsWith("/help");
  const isProfile =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/account");

  const profileHref = signedIn ? "/dashboard" : "/login";
  const profileLabel = signedIn ? copy.navDashboard : copy.navProfile;

  const itemClass = (active: boolean) =>
    `flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold tracking-wide transition ${
      active
        ? "bg-teal-700 text-white shadow-sm"
        : "text-teal-800 hover:bg-teal-50 dark:text-teal-100 dark:hover:bg-teal-950/50"
    }`;

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-teal-200/80 bg-white/95 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden dark:border-teal-900/60 dark:bg-zinc-950/95 dark:shadow-black/40"
      aria-label={t("Primary")}
      style={{
        paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="mx-auto flex w-full max-w-lg items-stretch gap-1 px-2 pt-1.5">
        <Link href="/" className={itemClass(isHome)} aria-current={isHome ? "page" : undefined}>
          <HomeIcon />
          <span>{t(copy.navHome)}</span>
        </Link>
        <Link
          href="/#how-it-works"
          className={itemClass(false)}
          onClick={(event) => {
            if (!isHome) return;
            event.preventDefault();
            document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          <InfoIcon />
          <span>{t(copy.navInfo)}</span>
        </Link>
        <Link href="/help" className={itemClass(isHelp)} aria-current={isHelp ? "page" : undefined}>
          <HelpIcon />
          <span>{t(copy.navHelp)}</span>
        </Link>
        <Link
          href={profileHref}
          className={itemClass(isProfile)}
          aria-current={isProfile ? "page" : undefined}
        >
          <ProfileIcon />
          <span>{t(profileLabel)}</span>
        </Link>
      </div>
    </nav>
  );
}
