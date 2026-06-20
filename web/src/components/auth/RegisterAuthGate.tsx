"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthPageShell } from "./AuthPageShell";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher";
import { RegistrationLanguageStep } from "@/components/registration/RegistrationLanguageStep";
import {
  REGISTER_GATE_COPY,
  confirmRegisterLanguage,
  isRegisterLanguageConfirmed,
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { formatSiteCase } from "@/lib/sentence-case";

function displayCopy(text: string, locale: HomeLocale): string {
  return locale === "en" ? formatSiteCase(text) : text;
}

export function RegisterAuthGate({ nextPath = "/register" }: { nextPath?: string }) {
  const [locale, setLocale] = useState<HomeLocale>("en");
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"language" | "gate">("language");

  useEffect(() => {
    const stored = readStoredHomeLocale();
    setLocale(stored);
    document.documentElement.lang = stored;
    if (isRegisterLanguageConfirmed()) {
      setStep("gate");
    }
    setReady(true);
  }, []);

  const handleLocaleChange = (next: HomeLocale) => {
    setLocale(next);
    storeHomeLocale(next);
  };

  const handleLanguageContinue = () => {
    storeHomeLocale(locale);
    confirmRegisterLanguage();
    setStep("gate");
  };

  if (!ready) {
    return null;
  }

  const copy = REGISTER_GATE_COPY[locale];
  const t = (text: string) => displayCopy(text, locale);

  if (step === "language") {
    return (
      <AuthPageShell
        title={copy.languageStep.titleBilingual}
        subtitle={copy.languageStep.subtitle}
        formatTitle={false}
      >
        <RegistrationLanguageStep
          locale={locale}
          onChange={handleLocaleChange}
          onContinue={handleLanguageContinue}
        />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title={t(copy.title)} subtitle={t(copy.subtitle)}>
      <div className="mb-5 flex justify-end">
        <LanguageSwitcher locale={locale} onChange={handleLocaleChange} variant="light" />
      </div>
      <div className="space-y-5 text-sm text-zinc-700 dark:text-zinc-300">
        <ol className="list-decimal space-y-2 pl-5">
          {copy.steps.map((stepText) => (
            <li key={stepText}>{t(stepText)}</li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="rounded-xl bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            {t(copy.createAccount)}
          </Link>
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="rounded-xl border border-zinc-300 px-5 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t(copy.loginExisting)}
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}
