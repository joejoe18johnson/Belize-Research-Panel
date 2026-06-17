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
