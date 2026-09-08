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

function FaqsIcon({ active, className = "h-5 w-5" }: { active?: boolean; className?: string }) {
  if (active) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M7 3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-3.2L9.5 20.4c-.5.4-1.2 0-1.2-.6V17H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm5 11.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-.1-7.7c-1.5 0-2.5.9-2.5 2.2 0 .4.3.8.8.8s.8-.4.8-.8c0-.4.4-.7.9-.7s.9.3.9.8c0 .4-.2.6-.8 1.1-.7.5-1.1 1-1.1 1.8v.1c0 .4.3.8.8.8s.8-.4.8-.8v-.1c0-.2.1-.4.5-.7.9-.7 1.4-1.2 1.4-2.2 0-1.4-1.1-2.3-2.5-2.3Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 4.5h9A2.5 2.5 0 0 1 19 7v7.5a2.5 2.5 0 0 1-2.5 2.5H13l-3.2 2.6c-.4.3-1 0-1-.5v-2.1H7.5A2.5 2.5 0 0 1 5 14.5V7A2.5 2.5 0 0 1 7.5 4.5Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.8 9.2a2.1 2.1 0 1 1 3.2 1.8c-.6.4-1.1.8-1.1 1.6M12 15.2h.01" />
    </svg>
  );
}

function HelpIcon({ active, className = "h-5 w-5" }: { active?: boolean; className?: string }) {
  if (active) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 15.2a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Zm1.2-4.4c-.9.5-1.3 1-1.3 1.9v.2a.9.9 0 1 1-1.8 0v-.2c0-1.5.8-2.3 1.8-2.9 1-.5 1.4-.9 1.4-1.6 0-.9-.7-1.5-1.6-1.5-.9 0-1.6.5-1.7 1.3a.9.9 0 1 1-1.8-.2C8.5 7.7 10 6.5 11.7 6.5c2 0 3.4 1.3 3.4 3.2 0 1.4-.8 2.2-1.9 2.9Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.6 9.5a2.4 2.4 0 1 1 3.6 2.1c-.7.4-1.2.9-1.2 1.8M12 16.5h.01" />
    </svg>
  );
}

function ProfileIcon({ active, className = "h-5 w-5" }: { active?: boolean; className?: string }) {
  if (active) {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M12 3.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 9.5c-4.2 0-7.5 2.4-7.5 5.4 0 .9.7 1.6 1.6 1.6h11.8c.9 0 1.6-.7 1.6-1.6 0-3-3.3-5.4-7.5-5.4Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.8 18.5a6.2 6.2 0 0 1 12.4 0" />
    </svg>
  );
}

function NavItem({
  href,
  label,
  active,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-2.5 text-[10px] font-semibold tracking-wide transition ${
        active ? "text-teal-700 dark:text-teal-300" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {active ? (
        <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-teal-600 dark:bg-teal-400" />
      ) : null}
      {icon}
      <span className="leading-none">{label}</span>
    </Link>
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
  const [hash, setHash] = useState("");
  const hidden = shouldHideBottomNav(pathname);

  useEffect(() => {
    setLocale(readStoredHomeLocale());
  }, [pathname]);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    if (hidden) {
      root.style.removeProperty("--brp-mobile-bottom-nav-offset");
      return;
    }
    root.style.setProperty("--brp-mobile-bottom-nav-offset", "5.75rem");
    return () => {
      root.style.removeProperty("--brp-mobile-bottom-nav-offset");
    };
  }, [hidden]);

  if (hidden) return null;

  const copy = HOME_COPY[locale];
  const t = (text: string) => displayCopy(text, locale);
  const isHome = pathname === "/";
  const onHelp = pathname.startsWith("/help");
  const isFaqs = onHelp && hash === "#faqs";
  const isHelp = onHelp && !isFaqs;
  const isProfile =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/account");

  const profileHref = signedIn ? "/dashboard" : "/login";
  const profileLabel = signedIn ? copy.navDashboard : copy.navProfile;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden"
      aria-label={t("Primary")}
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-950/95 dark:shadow-black/40">
        <NavItem href="/" label={t(copy.navHome)} active={isHome} icon={<HomeIcon active={isHome} />} />
        <NavItem
          href="/help#faqs"
          label={t(copy.navFaqsShort)}
          active={isFaqs}
          icon={<FaqsIcon active={isFaqs} />}
          onClick={() => setHash("#faqs")}
        />
        <NavItem
          href="/help"
          label={t(copy.navHelp)}
          active={isHelp}
          icon={<HelpIcon active={isHelp} />}
          onClick={() => setHash("")}
        />
        <NavItem
          href={profileHref}
          label={t(profileLabel)}
          active={isProfile}
          icon={<ProfileIcon active={isProfile} />}
        />
      </div>
    </nav>
  );
}
