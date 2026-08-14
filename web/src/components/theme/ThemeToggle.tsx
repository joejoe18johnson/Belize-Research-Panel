"use client";

import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

function SunIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M18.36 5.64l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      />
    </svg>
  );
}

const VARIANT_CLASS = {
  light:
    "border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-teal-700 dark:hover:bg-teal-950 dark:hover:text-teal-100",
  dark: "border border-white/20 bg-white/10 text-teal-100 hover:bg-white/15 hover:text-white",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
} as const;

export function ThemeToggle({
  className = "",
  variant = "light",
  compact = false,
}: {
  className?: string;
  variant?: keyof typeof VARIANT_CLASS;
  compact?: boolean;
}) {
  const { resolved, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl ${VARIANT_CLASS[variant]} ${className}`.trim()}
        aria-hidden
      />
    );
  }

  const isDark = resolved === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-sm font-medium transition ${VARIANT_CLASS[variant]} ${compact ? "min-w-10" : "min-w-10 sm:px-3"} ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {!compact ? <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span> : null}
    </button>
  );
}

const MENU_VARIANT_CLASS = {
  light:
    "border border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-800",
  dark: "border border-white/15 bg-white/10 text-teal-50 hover:bg-white/15",
  heroDark: "border border-white/15 bg-black/20 text-teal-50 hover:bg-white/10",
  heroLight:
    "border border-teal-200 bg-teal-50/80 text-teal-950 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-900/40",
} as const;

/** Full-width dark mode row for mobile menus and sidebars. */
export function ThemeMenuToggle({
  className = "",
  variant = "light",
  onActivate,
}: {
  className?: string;
  variant?: keyof typeof MENU_VARIANT_CLASS;
  onActivate?: () => void;
}) {
  const { resolved, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolved === "dark";
  const statusLabel = isDark ? "ON" : "OFF";
  const actionLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  const handleClick = () => {
    toggleTheme();
    onActivate?.();
  };

  if (!mounted) {
    return (
      <div
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${MENU_VARIANT_CLASS[variant]} ${className}`.trim()}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${MENU_VARIANT_CLASS[variant]} ${className}`.trim()}
      aria-label={`${actionLabel}. Dark mode is currently ${statusLabel}.`}
      title={actionLabel}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {isDark ? <MoonIcon className="h-5 w-5 shrink-0" /> : <SunIcon className="h-5 w-5 shrink-0" />}
        <span className="text-sm font-semibold">Dark mode</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
          isDark
            ? "bg-teal-600 text-white dark:bg-teal-500"
            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
        }`}
        aria-hidden
      >
        {statusLabel}
      </span>
    </button>
  );
}
