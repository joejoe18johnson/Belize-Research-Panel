"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Tip = {
  text: string;
  top: number;
  left: number;
  place: "above" | "below";
};

const TIP_SELECTOR = "[data-tooltip], [title], button, a, [role='button']";

function visibleText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".sr-only, [aria-hidden='true']").forEach((node) => node.remove());
  return (clone.textContent || "").replace(/\s+/g, " ").trim();
}

function tooltipText(el: HTMLElement): string {
  const explicit = (el.getAttribute("data-tooltip") || el.getAttribute("title") || "").trim();
  const shown = visibleText(el);
  if (explicit) {
    if (shown && shown.toLowerCase() === explicit.toLowerCase()) return "";
    return explicit;
  }
  const aria = (el.getAttribute("aria-label") || "").trim();
  if (aria && !shown) return aria;
  return "";
}

function hostFrom(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const match = target.closest(TIP_SELECTOR);
  return match instanceof HTMLElement ? match : null;
}

export function SiteTooltips() {
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    let active: HTMLElement | null = null;
    let pending: HTMLElement | null = null;
    let showTimer = 0;

    const restoreTitle = (el: HTMLElement | null) => {
      if (!el) return;
      const native = el.getAttribute("data-brp-title");
      if (native == null) return;
      el.setAttribute("title", native);
      el.removeAttribute("data-brp-title");
    };

    const hide = () => {
      window.clearTimeout(showTimer);
      pending = null;
      restoreTitle(active);
      active = null;
      setTip(null);
    };

    const show = (el: HTMLElement) => {
      const text = tooltipText(el);
      if (!text) {
        if (active === el) hide();
        return;
      }

      if (active && active !== el) restoreTitle(active);
      active = el;
      pending = null;

      const nativeTitle = el.getAttribute("title");
      if (nativeTitle) {
        el.setAttribute("data-brp-title", nativeTitle);
        el.removeAttribute("title");
      }

      const rect = el.getBoundingClientRect();
      const place = rect.top < 48 ? "below" : "above";
      const center = rect.left + rect.width / 2;
      const left = Math.min(Math.max(center, 16), window.innerWidth - 16);
      setTip({
        text,
        left,
        place,
        top: place === "above" ? rect.top - 8 : rect.bottom + 8,
      });
    };

    const schedule = (el: HTMLElement) => {
      if (active === el) return;
      pending = el;
      window.clearTimeout(showTimer);
      showTimer = window.setTimeout(() => {
        if (pending === el) show(el);
      }, 160);
    };

    const onOver = (event: Event) => {
      if ("pointerType" in event && (event as PointerEvent).pointerType === "touch") return;
      const el = hostFrom(event.target);
      if (!el) return;
      schedule(el);
    };

    const onOut = (event: Event) => {
      const el = hostFrom(event.target);
      const related = event instanceof FocusEvent ? event.relatedTarget : (event as MouseEvent).relatedTarget;
      if (el && related instanceof Node && el.contains(related)) return;
      if (el && el === pending) {
        pending = null;
        window.clearTimeout(showTimer);
      }
      if (!el || el !== active) return;
      hide();
    };

    const onScroll = () => {
      if (active) hide();
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onOver);
    document.addEventListener("focusout", onOut);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.clearTimeout(showTimer);
      restoreTitle(active);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onOver);
      document.removeEventListener("focusout", onOut);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  if (!tip || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="tooltip"
      style={{
        top: tip.top,
        left: tip.left,
        transform: tip.place === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }}
      className="pointer-events-none fixed z-[80] max-w-xs rounded-lg bg-zinc-900 px-2.5 py-1.5 text-center text-xs font-medium leading-snug text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
    >
      {tip.text}
    </div>,
    document.body
  );
}
