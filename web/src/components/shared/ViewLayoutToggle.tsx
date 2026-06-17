"use client";

import type { ViewLayout } from "@/lib/view-layout";
import { VIEW_LAYOUT_OPTIONS } from "@/lib/view-layout";
import { useEffect, useState } from "react";
import {
  defaultViewLayoutForViewport,
  readStoredViewLayout,
  storeViewLayout,
} from "@/lib/view-layout";

export function useViewLayout(scope: string, preferredDefault: ViewLayout = "cards") {
  const [layout, setLayoutState] = useState<ViewLayout>(preferredDefault);

  useEffect(() => {
    const stored = readStoredViewLayout(scope);
    setLayoutState(stored ?? defaultViewLayoutForViewport() ?? preferredDefault);
  }, [scope, preferredDefault]);

  const setLayout = (next: ViewLayout) => {
    setLayoutState(next);
    storeViewLayout(scope, next);
  };

  return [layout, setLayout] as const;
}

function LayoutIcon({ layout }: { layout: ViewLayout }) {
  if (layout === "list") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

export function ViewLayoutToggle({
  value,
  onChange,
  className = "",
  compactOnMobile = true,
  variant = "light",
}: {
  value: ViewLayout;
  onChange: (layout: ViewLayout) => void;
  className?: string;
  compactOnMobile?: boolean;
  variant?: "light" | "dark";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const labelClass = variant === "dark" ? "text-teal-100" : "text-zinc-500";
  const shellClass =
    variant === "dark" ? "border-white/20 bg-white/10" : "border-zinc-200 bg-zinc-50";
  const activeClass =
    variant === "dark" ? "bg-white text-teal-900 shadow-sm" : "bg-white text-teal-800 shadow-sm";
  const idleClass =
    variant === "dark" ? "text-teal-100 hover:text-white" : "text-zinc-600 hover:text-teal-800";

  return (
    <div
      className={`flex items-center gap-2 ${className}`.trim()}
      role="group"
      aria-label="Choose layout"
    >
      <span className={`text-xs font-medium ${labelClass} ${compactOnMobile ? "hidden sm:inline" : ""}`}>
        Layout
      </span>
      <div className={`inline-flex rounded-xl border p-1 ${shellClass}`}>
        {VIEW_LAYOUT_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={value === option.id}
            aria-label={option.label}
            title={option.label}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 ${
              value === option.id ? activeClass : idleClass
            }`}
          >
            <LayoutIcon layout={option.id} />
            <span className={compactOnMobile ? "hidden sm:inline" : ""}>{option.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
