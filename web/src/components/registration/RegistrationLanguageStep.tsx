"use client";

import { useId } from "react";
import type { HomeLocale } from "@/lib/home-locale";
import { HOME_COPY, REGISTER_GATE_COPY, localeDisplayName } from "@/lib/home-locale";

function UkFlagIcon({ className = "", clipId }: { className?: string; clipId: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <clipPath id={clipId}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0 24 24M24 0 0 24" stroke="#fff" strokeWidth="4.8" />
        <path d="M0 0 24 24M24 0 0 24" stroke="#C8102E" strokeWidth="2.4" />
        <path d="M10 0h4v24h-4zM0 10v4h24v-4z" fill="#fff" />
        <path d="M11 0h2v24h-2zM0 11v2h24v-2z" fill="#C8102E" />
      </g>
    </svg>
  );
}

function SpainFlagIcon({ className = "", clipId }: { className?: string; clipId: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <clipPath id={clipId}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="24" height="24" fill="#AA151B" />
        <rect y="6" width="24" height="12" fill="#F1BF00" />
      </g>
    </svg>
  );
}

const LANGUAGE_OPTIONS: HomeLocale[] = ["en", "es"];

export function RegistrationLanguageStep({
  locale,
  onChange,
  onContinue,
}: {
  locale: HomeLocale;
  onChange: (locale: HomeLocale) => void;
  onContinue: () => void;
}) {
  const copy = REGISTER_GATE_COPY[locale].languageStep;
  const ukClipId = useId();
  const esClipId = useId();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={HOME_COPY[locale].languageLabel}>
        {LANGUAGE_OPTIONS.map((option) => {
          const selected = locale === option;
          const label = localeDisplayName(option);
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                selected
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/30 dark:border-teal-500 dark:bg-teal-950/40 dark:ring-teal-500/30"
                  : "border-zinc-200 bg-white hover:border-teal-200 hover:bg-teal-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-teal-800 dark:hover:bg-teal-950/20"
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                {option === "en" ? (
                  <UkFlagIcon className="h-7 w-7" clipId={ukClipId} />
                ) : (
                  <SpainFlagIcon className="h-7 w-7" clipId={esClipId} />
                )}
              </span>
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
      >
        {copy.continue}
      </button>
    </div>
  );
}
