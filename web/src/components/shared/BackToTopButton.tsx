"use client";

import { useEffect, useState, type RefObject } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";

function readScrollOffset(windowScroll: number, container: HTMLElement | null): number {
  return Math.max(windowScroll, container?.scrollTop ?? 0);
}

export function BackToTopButton({
  scrollContainerRef,
  showAfter = 320,
}: {
  scrollContainerRef?: RefObject<HTMLElement | null>;
  showAfter?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const container = scrollContainerRef?.current ?? null;
      setVisible(readScrollOffset(windowScroll, container) > showAfter);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });

    const container = scrollContainerRef?.current;
    container?.addEventListener("scroll", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      container?.removeEventListener("scroll", update);
    };
  }, [scrollContainerRef, showAfter]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    scrollContainerRef?.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={formatHeadingCase("Back to top")}
      title={formatHeadingCase("Back to top")}
      className={`fixed z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-teal-200 bg-white/95 text-teal-800 shadow-lg shadow-teal-950/10 backdrop-blur-sm transition-all duration-200 hover:border-teal-300 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-teal-700 dark:bg-zinc-900/95 dark:text-teal-100 dark:hover:border-teal-600 dark:hover:bg-teal-950 dark:shadow-black/30 ${
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        right: "max(1rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path
          d="M12 19V5M12 5l-6 6M12 5l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
