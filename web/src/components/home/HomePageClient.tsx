"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { LanguageSwitcher } from "@/components/home/LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
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

function HomeFeatureCard({
  title,
  body,
  onDarkHero,
}: {
  title: string;
  body: string;
  onDarkHero: boolean;
}) {
  const cardClass = onDarkHero
    ? "rounded-2xl border border-white/10 bg-white/5 p-4"
    : "rounded-2xl border border-teal-200 bg-white p-4 shadow-sm dark:border-teal-800 dark:bg-zinc-900";
  const titleClass = onDarkHero
    ? "text-base font-semibold"
    : "text-base font-semibold text-zinc-900 dark:text-zinc-100";
  const bodyClass = onDarkHero
    ? "mt-1 text-sm leading-relaxed text-teal-100"
    : "mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

  return (
    <div className={cardClass}>
      <h2 className={titleClass}>{title}</h2>
      <p className={bodyClass}>{body}</p>
    </div>
  );
}

function HomeRewardPerkCard({
  title,
  body,
  icon,
  onDarkHero,
}: {
  title: string;
  body: string;
  icon: string;
  onDarkHero: boolean;
}) {
  const cardClass = onDarkHero
    ? "flex items-start gap-3 rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm"
    : "flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 dark:border-teal-800 dark:bg-teal-950/40";
  const titleClass = onDarkHero ? "text-sm font-bold text-white" : "text-sm font-bold text-teal-950 dark:text-teal-100";
  const bodyClass = onDarkHero
    ? "mt-1 text-xs leading-relaxed text-teal-100"
    : "mt-1 text-xs leading-relaxed text-teal-800 dark:text-teal-200";

  return (
    <div className={cardClass}>
      <p className="text-2xl" aria-hidden>
        {icon}
      </p>
      <div>
        <h3 className={titleClass}>{title}</h3>
        <p className={bodyClass}>{body}</p>
      </div>
    </div>
  );
}

function HomeHowItWorksStep({
  step,
  title,
  body,
  onDarkHero,
}: {
  step: number;
  title: string;
  body: string;
  onDarkHero: boolean;
}) {
  const cardClass = onDarkHero
    ? "rounded-2xl border border-white/10 bg-white/5 p-5"
    : "rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:border-teal-800 dark:bg-zinc-900";
  const stepClass = onDarkHero
    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-sm font-bold text-amber-200 ring-1 ring-amber-300/40"
    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800 ring-1 ring-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-800";
  const titleClass = onDarkHero
    ? "text-base font-semibold text-white"
    : "text-base font-semibold text-zinc-900 dark:text-zinc-100";
  const bodyClass = onDarkHero
    ? "mt-2 text-sm leading-relaxed text-teal-100"
    : "mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-4">
        <span className={stepClass} aria-hidden>
          {step}
        </span>
        <div>
          <h3 className={titleClass}>{title}</h3>
          <p className={bodyClass}>{body}</p>
        </div>
      </div>
    </div>
  );
}

export function HomePageClient() {
  const [locale, setLocale] = useState<HomeLocale>("en");
  const { resolved } = useTheme();
  const onDarkHero = resolved === "dark";

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
    <div
      className={
        onDarkHero
          ? "min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-zinc-900 text-white"
          : "min-h-screen bg-gradient-to-b from-teal-50 via-white to-zinc-50 text-zinc-900"
      }
    >
      <header className="safe-top mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-3">
          <BrpLogoLink href="/" variant="light" />

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher
              locale={locale}
              onChange={handleLocaleChange}
              variant={onDarkHero ? "dark" : "light"}
            />

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className={
                  onDarkHero
                    ? "flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-teal-100 hover:bg-white/10"
                    : "flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100"
                }
              >
                {t(copy.logIn)}
              </Link>
              <Link
                href="/register"
                className={
                  onDarkHero
                    ? "flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50"
                    : "flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                }
              >
                {t(copy.register)}
              </Link>
            </div>

            <ThemeToggle variant={onDarkHero ? "dark" : "light"} compact />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="max-w-3xl">
          <p
            className={
              onDarkHero
                ? "mb-4 inline-flex rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-1.5 text-sm font-semibold text-amber-100"
                : "mb-4 inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-900"
            }
          >
            {t(copy.rewardsBadge)}
          </p>
          <p className={onDarkHero ? "text-sm font-medium text-teal-200" : "text-sm font-medium text-teal-700"}>
            {t(copy.eyebrow)}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{t(copy.headline)}</h1>
          <p
            className={
              onDarkHero
                ? "mt-5 text-base leading-relaxed text-teal-100 sm:mt-6 sm:text-lg"
                : "mt-5 text-base leading-relaxed text-zinc-600 sm:mt-6 sm:text-lg"
            }
          >
            {t(copy.description)}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/register"
              className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-6 py-3 text-sm font-bold text-teal-950 shadow-lg shadow-amber-900/30 hover:bg-amber-300"
            >
              {t(copy.registerCta)}
            </Link>
            <Link
              href="/login"
              className={
                onDarkHero
                  ? "flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  : "flex min-h-12 items-center justify-center rounded-xl border border-teal-300 px-6 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"
              }
            >
              {t(copy.loginCta)}
            </Link>
          </div>
        </div>

        <section className="mt-14 sm:mt-20">
          <p
            className={
              onDarkHero
                ? "text-xs font-bold uppercase tracking-[0.18em] text-amber-200"
                : "text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300"
            }
          >
            {t(copy.howItWorksEyebrow)}
          </p>
          <h2
            className={
              onDarkHero
                ? "mt-2 text-2xl font-bold text-white sm:text-3xl"
                : "mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl"
            }
          >
            {t(copy.howItWorksHeadline)}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {copy.howItWorksSteps.map((step, index) => (
              <HomeHowItWorksStep
                key={step.title}
                step={index + 1}
                title={t(step.title)}
                body={t(step.body)}
                onDarkHero={onDarkHero}
              />
            ))}
          </div>
        </section>

        <section
          className={
            onDarkHero
              ? "mt-12 overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-amber-400/20 via-white/10 to-teal-500/10 p-6 shadow-2xl shadow-black/20 sm:mt-16 sm:p-8"
              : "mt-12 overflow-hidden rounded-3xl border border-teal-200 bg-white p-6 shadow-lg shadow-teal-950/5 dark:border-teal-800 dark:bg-zinc-900 sm:mt-16 sm:p-8"
          }
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p
                className={
                  onDarkHero
                    ? "text-xs font-bold uppercase tracking-[0.18em] text-amber-200"
                    : "text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300"
                }
              >
                Rewards program
              </p>
              <h2
                className={
                  onDarkHero
                    ? "mt-2 text-2xl font-bold text-white sm:text-3xl"
                    : "mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl"
                }
              >
                {t(copy.rewardsHeadline)}
              </h2>
              <p
                className={
                  onDarkHero
                    ? "mt-3 text-sm leading-relaxed text-teal-50 sm:text-base"
                    : "mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base"
                }
              >
                {t(copy.rewardsDescription)}
              </p>
              <Link
                href="/register"
                className={
                  onDarkHero
                    ? "mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-teal-900 hover:bg-amber-50"
                    : "mt-5 inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800"
                }
              >
                {t(copy.rewardsCta)}
              </Link>
            </div>
            <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:shrink-0">
              {copy.rewardPerks.map((perk, index) => (
                <HomeRewardPerkCard
                  key={perk.title}
                  title={t(perk.title)}
                  body={t(perk.body)}
                  icon={REWARD_ICONS[index] ?? "✨"}
                  onDarkHero={onDarkHero}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <div className="flex flex-col gap-3">
            {copy.features.map((feature) => (
              <HomeFeatureCard
                key={feature.title}
                title={t(feature.title)}
                body={t(feature.body)}
                onDarkHero={onDarkHero}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
