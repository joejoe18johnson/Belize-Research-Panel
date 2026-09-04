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

const SWITCH_SHELL_CLASS = {
  light:
    "border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-teal-300 hover:bg-teal-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-teal-700",
  dark: "border border-white/20 bg-white/10 text-teal-50 hover:bg-white/15",
} as const;

const MENU_VARIANT_CLASS = {
  light:
    "border border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:bg-zinc-800",
  dark: "border border-white/15 bg-white/10 text-teal-50 hover:bg-white/15",
  heroDark: "border border-white/15 bg-black/20 text-teal-50 hover:bg-white/10",
  heroLight:
    "border border-teal-200 bg-teal-50/80 text-teal-950 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-900/40",
} as const;

function useThemeSwitchState() {
  const { resolved, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolved === "dark";
  const statusLabel = isDark ? "ON" : "OFF";
  const actionLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  return { mounted, isDark, statusLabel, actionLabel, toggleTheme };
}

function ThemeSwitchTrack({ isDark, compact = false }: { isDark: boolean; compact?: boolean }) {
  return (
    <span
      className={`relative inline-flex shrink-0 rounded-full transition-colors duration-200 ${
        compact ? "h-5 w-9" : "h-6 w-11"
      } ${isDark ? "bg-teal-600 dark:bg-teal-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
      aria-hidden
    >
      <span
        className={`absolute top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          compact ? "left-0.5 h-4 w-4" : "left-0.5 h-5 w-5"
        } ${isDark ? (compact ? "translate-x-4" : "translate-x-5") : "translate-x-0"}`}
      />
    </span>
  );
}

/** Icon-only theme control for cramped headers: sun in dark mode, moon in light mode. */
export function ThemeIconButton({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: keyof typeof SWITCH_SHELL_CLASS;
}) {
  const { mounted, isDark, actionLabel, toggleTheme } = useThemeSwitchState();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={actionLabel}
      title={actionLabel}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${SWITCH_SHELL_CLASS[variant]} ${className}`.trim()}
    >
      {mounted ? (
        isDark ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )
      ) : (
        <span className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}

/** Labeled dark-mode switch for toolbars and headers. */
export function ThemeSwitch({
  className = "",
  variant = "light",
  showLabel = true,
  compact = false,
}: {
  className?: string;
  variant?: keyof typeof SWITCH_SHELL_CLASS;
  showLabel?: boolean;
  compact?: boolean;
}) {
  const { mounted, isDark, statusLabel, actionLabel, toggleTheme } = useThemeSwitchState();

  if (!mounted) {
    return (
      <span
        className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-2.5 ${SWITCH_SHELL_CLASS[variant]} ${className}`.trim()}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`${actionLabel}. Dark mode is ${statusLabel}.`}
      title={actionLabel}
      onClick={toggleTheme}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition ${SWITCH_SHELL_CLASS[variant]} ${className}`.trim()}
    >
      {showLabel ? (
        <span className="flex min-w-0 items-center gap-1.5">
          {isDark ? <MoonIcon className="h-4 w-4 shrink-0 opacity-80" /> : <SunIcon className="h-4 w-4 shrink-0 opacity-80" />}
          <span className={`whitespace-nowrap font-semibold ${compact ? "text-xs" : "text-sm"}`}>Dark mode</span>
        </span>
      ) : null}
      <ThemeSwitchTrack isDark={isDark} compact={compact} />
      <span
        className={`shrink-0 font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${
          compact ? "w-6 text-[10px]" : "w-7 text-[11px]"
        } ${isDark ? "text-teal-700 dark:text-teal-300" : ""}`}
        aria-hidden
      >
        {statusLabel}
      </span>
    </button>
  );
}

/** @deprecated Prefer ThemeSwitch — icon-only compact button. */
export function ThemeToggle({
  className = "",
  variant = "light",
  compact = false,
}: {
  className?: string;
  variant?: keyof typeof SWITCH_SHELL_CLASS;
  compact?: boolean;
}) {
  return <ThemeSwitch className={className} variant={variant} showLabel={!compact} compact={compact} />;
}

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
  const { mounted, isDark, statusLabel, actionLabel, toggleTheme } = useThemeSwitchState();

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
      role="switch"
      aria-checked={isDark}
      aria-label={`${actionLabel}. Dark mode is ${statusLabel}.`}
      title={actionLabel}
      onClick={handleClick}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${MENU_VARIANT_CLASS[variant]} ${className}`.trim()}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {isDark ? <MoonIcon className="h-5 w-5 shrink-0" /> : <SunIcon className="h-5 w-5 shrink-0" />}
        <span className="text-sm font-semibold">Dark mode</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <ThemeSwitchTrack isDark={isDark} />
        <span
          className={`w-7 text-center text-[11px] font-bold uppercase tracking-wide ${
            isDark ? "text-teal-700 dark:text-teal-300" : "text-zinc-500 dark:text-zinc-400"
          }`}
          aria-hidden
        >
          {statusLabel}
        </span>
      </span>
    </button>
  );
}
