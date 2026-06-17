"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEntryButton } from "@/components/admin/AdminEntryButton";
import { BrpLogoLink } from "@/components/BrpLogo";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher";
import {
  HOME_COPY,
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { formatHeadingCase } from "@/lib/sentence-case";

export function HomePageClient() {
  const [locale, setLocale] = useState<HomeLocale>("en");

  useEffect(() => {
    const stored = readStoredHomeLocale();
    setLocale(stored);
    document.documentElement.lang = stored;
  }, []);

  const handleLocaleChange = (next: HomeLocale) => {
    setLocale(next);
    storeHomeLocale(next);
  };

  const copy = HOME_COPY[locale];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-zinc-900 text-white">
      <header className="safe-top mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <BrpLogoLink href="/" variant="dark" />

          <div className="flex flex-col items-end gap-3">
            <LanguageSwitcher locale={locale} onChange={handleLocaleChange} />

            <div className="hidden items-center gap-3 sm:flex">
              <AdminEntryButton variant="header" />
              <Link
                href="/login"
                className="flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-teal-100 hover:bg-white/10"
              >
                {copy.logIn}
              </Link>
              <Link
                href="/register"
                className="flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50"
              >
                {copy.register}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:hidden">
          <AdminEntryButton variant="header" />
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/login"
              className="flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-teal-100 hover:bg-white/10"
            >
              {copy.logIn}
            </Link>
            <Link
              href="/register"
              className="flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50"
            >
              {copy.register}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-teal-200">{copy.eyebrow}</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{copy.headline}</h1>
          <p className="mt-5 text-base leading-relaxed text-teal-100 sm:mt-6 sm:text-lg">{copy.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/register"
              className="flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-lg hover:bg-teal-50"
            >
              {copy.registerCta}
            </Link>
            <Link
              href="/login"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {copy.loginCta}
            </Link>
            <AdminEntryButton variant="inline" />
          </div>
        </div>

        <section className="mt-14 grid gap-4 sm:mt-20 sm:gap-6 md:grid-cols-3">
          {copy.features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">
                {locale === "en" ? formatHeadingCase(feature.title) : feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-teal-100">{feature.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
