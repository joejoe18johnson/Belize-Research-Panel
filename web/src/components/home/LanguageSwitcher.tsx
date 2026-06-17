"use client";

import type { HomeLocale } from "@/lib/home-locale";
import { HOME_COPY } from "@/lib/home-locale";

function UkFlagIcon() {
  return (
    <svg viewBox="0 0 24 16" width="22" height="15" aria-hidden className="rounded-[2px] shadow-sm ring-1 ring-white/20">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M10 0h4v16h-4zM0 6v4h24V6z" fill="#fff" />
      <path d="M11 0h2v16h-2zM0 7v2h24V7z" fill="#C8102E" />
    </svg>
  );
}

function SpainFlagIcon() {
  return (
    <svg viewBox="0 0 24 16" width="22" height="15" aria-hidden className="rounded-[2px] shadow-sm ring-1 ring-white/20">
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </svg>
  );
}

export function LanguageSwitcher({
  locale,
  onChange,
}: {
  locale: HomeLocale;
  onChange: (locale: HomeLocale) => void;
}) {
  const copy = HOME_COPY[locale];

  return (
    <div
      className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 p-1 shadow-lg backdrop-blur-sm"
      role="group"
      aria-label={copy.languageLabel}
    >
      <button
        type="button"
        onClick={() => onChange("en")}
        aria-pressed={locale === "en"}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          locale === "en" ? "bg-white text-teal-900 shadow-sm" : "text-teal-50 hover:bg-white/10"
        }`}
      >
        <UkFlagIcon />
        <span>{copy.english}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("es")}
        aria-pressed={locale === "es"}
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          locale === "es" ? "bg-white text-teal-900 shadow-sm" : "text-teal-50 hover:bg-white/10"
        }`}
      >
        <SpainFlagIcon />
        <span>{copy.spanish}</span>
      </button>
    </div>
  );
}
