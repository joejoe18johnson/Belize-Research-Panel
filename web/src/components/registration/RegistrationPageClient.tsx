"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher";
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
import { appContentClass } from "@/lib/layout-widths";
import { formatHeadingCase, formatSiteCase } from "@/lib/sentence-case";

function displayCopy(text: string, locale: HomeLocale): string {
  return locale === "en" ? formatSiteCase(text) : text;
}

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

  const handleLocaleChange = (next: HomeLocale) => {
    setLocale(next);
    storeHomeLocale(next);
  };

  const handleLanguageContinue = () => {
    storeHomeLocale(locale);
    confirmRegisterLanguage();
    setLanguageConfirmed(true);
  };

  if (!ready) {
    return null;
  }

  const copy = REGISTER_GATE_COPY[locale];
  const t = (text: string) => displayCopy(text, locale);

  if (!languageConfirmed) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-800">
        <header className="safe-top border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className={`${appContentClass} flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4`}>
            <BrpLogoLink href="/" variant="light" />
          </div>
        </header>
        <main className={`${appContentClass} px-3 py-8 sm:px-4 sm:py-16`}>
          <div className="mx-auto max-w-xl rounded-2xl border border-teal-100 bg-white p-5 shadow-sm dark:border-teal-900/50 dark:bg-zinc-900 sm:p-8">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-800">
      <header className="safe-top sticky top-0 z-30 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className={`relative ${appContentClass} flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4`}>
          <BrpLogoLink href="/" variant="light" />
          <div className="absolute right-3 flex items-center gap-2 text-sm sm:right-4 sm:gap-3">
            <LanguageSwitcher locale={locale} onChange={handleLocaleChange} variant="light" />
            <Link
              href="/account/delete"
              className="hidden text-xs font-medium text-zinc-500 hover:text-teal-800 dark:text-zinc-400 dark:hover:text-teal-200 sm:inline"
            >
              {formatHeadingCase("Delete account")}
            </Link>
            <span className="hidden max-w-[12rem] truncate text-zinc-600 dark:text-zinc-500 md:inline">{account.email}</span>
            <LogoutButton className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-900 dark:text-teal-100 dark:hover:bg-teal-900/40 sm:px-4" />
          </div>
        </div>
      </header>
      <main className={`${appContentClass} px-3 py-6 sm:px-4 sm:py-8`}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {t(copy.title)}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-500">
            {locale === "en"
              ? t(
                  "Your account is verified. Complete the steps below to join the panel for public opinion polling, market research, and governance studies."
                )
              : "Su cuenta está verificada. Complete los pasos a continuación para unirse al panel de encuestas de opinión pública, investigación de mercado y estudios de gobernanza."}
          </p>
        </div>
        <RegistrationForm account={account} />
      </main>
    </div>
  );
}
