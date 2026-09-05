"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BackToTopButton } from "@/components/shared/BackToTopButton";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher";
import { ThemeIconButton } from "@/components/theme/ThemeToggle";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { RegistrationLanguageStep } from "@/components/registration/RegistrationLanguageStep";
import type { RegistrationAccountContext } from "@/components/registration/RegistrationForm";
import {
  REGISTER_GATE_COPY,
  confirmRegisterLanguage,
  isRegisterLanguageConfirmed,
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { appContentClass, pageRootClass } from "@/lib/layout-widths";
import { observeStickyChrome, scrollViewportToTop } from "@/lib/scroll-viewport";
import { formatHeadingCase } from "@/lib/sentence-case";

export function RegistrationPageClient({
  account,
}: {
  account: RegistrationAccountContext & { email: string };
}) {
  const [locale, setLocale] = useState<HomeLocale>("en");
  const [ready, setReady] = useState(false);
  const [languageConfirmed, setLanguageConfirmed] = useState(false);

  useEffect(() => {
    const stored = readStoredHomeLocale();
    setLocale(stored);
    document.documentElement.lang = stored;
    setLanguageConfirmed(isRegisterLanguageConfirmed());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    return observeStickyChrome();
  }, [ready, languageConfirmed]);

  const handleLocaleChange = (next: HomeLocale) => {
    setLocale(next);
    storeHomeLocale(next);
  };

  const handleLanguageContinue = () => {
    storeHomeLocale(locale);
    confirmRegisterLanguage();
    setLanguageConfirmed(true);
    scrollViewportToTop();
  };

  if (!ready) {
    return null;
  }

  const copy = REGISTER_GATE_COPY[locale];

  if (!languageConfirmed) {
    return (
      <div className={`${pageRootClass} bg-zinc-100 dark:bg-zinc-950`}>
        <header data-sticky-chrome="header" className="safe-top sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className={`${appContentClass} min-w-0 px-3 py-3 sm:px-4 sm:py-4`}>
            <div className="flex min-w-0 items-center justify-between gap-3">
              <BrpLogoLink href="/" variant="light" className="min-w-0 shrink" />
              <ThemeIconButton />
            </div>
          </div>
        </header>
        <main className={`${appContentClass} min-w-0 px-3 py-8 sm:px-4 sm:py-16`}>
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-teal-100 bg-white p-5 shadow-sm dark:border-teal-900/50 dark:bg-zinc-900 sm:p-8">
            <h1 className="text-xl font-bold text-teal-950 dark:text-teal-100 sm:text-2xl">
              {copy.languageStep.titleBilingual}
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{copy.languageStep.subtitle}</p>
            <div className="mt-6">
              <RegistrationLanguageStep
                locale={locale}
                onChange={handleLocaleChange}
                onContinue={handleLanguageContinue}
              />
            </div>
          </div>
        </main>
        <BackToTopButton />
      </div>
    );
  }

  return (
    <div className={`${pageRootClass} bg-zinc-100 overscroll-y-contain dark:bg-zinc-950`}>
      <header data-sticky-chrome="header" className="safe-top sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className={`${appContentClass} min-w-0 px-3 py-3 sm:px-4 sm:py-4`}>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <BrpLogoLink href="/" variant="light" className="min-w-0 shrink" />
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <LanguageSwitcher locale={locale} onChange={handleLocaleChange} variant="light" />
              <Link
                href="/account/delete"
                className="hidden text-xs font-medium text-zinc-500 hover:text-teal-800 dark:text-zinc-400 dark:hover:text-teal-200 lg:inline"
              >
                {formatHeadingCase("Delete account")}
              </Link>
              <span className="hidden max-w-[12rem] truncate text-zinc-600 dark:text-zinc-500 lg:inline">{account.email}</span>
              <LogoutButton
                compact
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-teal-700 hover:bg-teal-50 hover:text-teal-900 dark:text-teal-100 dark:hover:bg-teal-900/40 lg:hidden"
              />
              <LogoutButton
                className="hidden min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-900 dark:text-teal-100 dark:hover:bg-teal-900/40 lg:flex"
              />
              <ThemeIconButton />
            </div>
          </div>
        </div>
      </header>
      <main className={`${appContentClass} px-3 py-6 sm:px-4 sm:py-8`}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {locale === "en" ? "Verify Your Account to Continue" : "Verifique su cuenta para continuar"}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-500">
            {locale === "en"
              ? "Complete verification to join the panel for Public Opinion Polling, Market Research, and Governance Studies."
              : "Complete la verificación para unirse al panel de encuestas de opinión pública, investigación de mercado y estudios de gobernanza."}
          </p>
        </div>
        <RegistrationForm account={account} />
      </main>
      <BackToTopButton />
    </div>
  );
}
