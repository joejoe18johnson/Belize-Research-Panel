"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { HomeLocale } from "@/lib/home-locale";
import { HOME_COPY } from "@/lib/home-locale";

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

function FlagIcon({ locale, className, clipId }: { locale: HomeLocale; className?: string; clipId: string }) {
  return locale === "en" ? (
    <UkFlagIcon className={className} clipId={clipId} />
  ) : (
    <SpainFlagIcon className={className} clipId={clipId} />
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const ukClipId = useId();
  const esClipId = useId();
  const triggerClipId = locale === "en" ? ukClipId : esClipId;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectLocale = (next: HomeLocale) => {
    onChange(next);
    setOpen(false);
  };

  const options: { id: HomeLocale; label: string }[] = [
    { id: "en", label: copy.english },
    { id: "es", label: copy.spanish },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={copy.languageLabel}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white shadow-sm ring-1 ring-white/20 transition hover:bg-white/25"
      >
        <FlagIcon locale={locale} className="h-6 w-6" clipId={triggerClipId} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={copy.languageLabel}
          className="absolute right-0 z-20 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1 text-zinc-900 shadow-xl"
        >
          {options.map((option) => {
            const selected = locale === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectLocale(option.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-teal-50 ${
                  selected ? "bg-teal-50/80 font-semibold text-teal-900" : "text-zinc-700"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200">
                  <FlagIcon
                    locale={option.id}
                    className="h-5 w-5"
                    clipId={option.id === "en" ? ukClipId : esClipId}
                  />
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
