"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/shared/ToastProvider";

interface IncomingToast {
  id: string;
  title: string;
  body: string;
  tone: "success" | "warning" | "info";
  href: string;
  hrefLabel?: string;
}

const SEEN_KEY = "brp-verification-toasts";
const toastedThisPage = new Set<string>();

function readSeen(): Set<string> {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export function DashboardIncomingToasts() {
  const { showToast } = useToast();
  const checking = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (checking.current || document.hidden) return;
      checking.current = true;
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { toasts?: IncomingToast[] };
        const incoming = data.toasts ?? [];
        const seen = readSeen();
        const currentIds = new Set(incoming.map((toast) => toast.id));

        for (const toast of incoming) {
          if (seen.has(toast.id) || toastedThisPage.has(toast.id)) continue;
          seen.add(toast.id);
          toastedThisPage.add(toast.id);
          writeSeen(seen);
          showToast({
            title: toast.title,
            body: toast.body,
            tone: toast.tone,
            href: toast.href,
            hrefLabel: toast.hrefLabel ?? "View alerts",
          });
        }

        for (const id of [...seen]) {
          if (!currentIds.has(id)) {
            seen.delete(id);
            toastedThisPage.delete(id);
          }
        }
        writeSeen(seen);
      } catch {
        // The alerts list still shows the update if this check cannot reach the server.
      } finally {
        checking.current = false;
      }
    };

    void check();
    const timer = window.setInterval(() => void check(), 15000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [showToast]);

  return null;
}
