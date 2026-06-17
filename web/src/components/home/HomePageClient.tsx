"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher";
import {
  HOME_COPY,
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { formatSiteCase } from "@/lib/sentence-case";

function displayCopy(text: string, locale: HomeLocale): string {
  return locale === "en" ? formatSiteCase(text) : text;
}

const REWARD_ICONS = ["💵", "📱", "🎁", "✨"] as const;

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
  const t = (text: string) => displayCopy(text, locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-zinc-900 text-white">
      <header className="safe-top mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <BrpLogoLink href="/" variant="dark" />

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher locale={locale} onChange={handleLocaleChange} />

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-teal-100 hover:bg-white/10"
              >
                {t(copy.logIn)}
              </Link>
              <Link
                href="/register"
                className="flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50"
              >
                {t(copy.register)}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-1.5 text-sm font-semibold text-amber-100">
            {t(copy.rewardsBadge)}
          </p>
          <p className="text-sm font-medium text-teal-200">{t(copy.eyebrow)}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{t(copy.headline)}</h1>
          <p className="mt-5 text-base leading-relaxed text-teal-100 sm:mt-6 sm:text-lg">{t(copy.description)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/register"
              className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-teal-950 shadow-lg shadow-amber-900/30 hover:bg-amber-300"
            >
              {t(copy.registerCta)}
            </Link>
            <Link
              href="/login"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t(copy.loginCta)}
            </Link>
          </div>
        </div>

        <section className="mt-12 overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-400/20 via-white/10 to-teal-500/10 p-6 shadow-2xl shadow-black/20 sm:mt-16 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Rewards program</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t(copy.rewardsHeadline)}</h2>
              <p className="mt-3 text-sm leading-relaxed text-teal-50 sm:text-base">{t(copy.rewardsDescription)}</p>
              <Link
                href="/register"
                className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-teal-900 hover:bg-amber-50"
              >
                {t(copy.rewardsCta)}
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl lg:shrink-0">
              {copy.rewardPerks.map((perk, index) => (
                <div
                  key={perk.title}
                  className="rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm"
                >
                  <p className="text-2xl" aria-hidden>
                    {REWARD_ICONS[index] ?? "✨"}
                  </p>
                  <h3 className="mt-2 text-sm font-bold text-white">{t(perk.title)}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-teal-100">{t(perk.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:mt-20 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
          {copy.features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">{t(feature.title)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-teal-100">{t(feature.body)}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
