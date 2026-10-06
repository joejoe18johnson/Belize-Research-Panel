"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { type FeedbackTone } from "@/lib/site-alerts";
import { formatHeadingCase } from "@/lib/sentence-case";

export interface ToastInput {
  title: string;
  body?: string;
  tone?: FeedbackTone;
  href?: string;
  hrefLabel?: string;
}

interface ToastItem extends ToastInput {
  id: string;
  tone: FeedbackTone;
}

const ToastContext = createContext<{ showToast: (toast: ToastInput) => void } | null>(null);

/** Survives a dashboard refresh remounting this provider, so a just-saved action still pops up. */
let liveToasts: ToastItem[] = [];
const toastListeners = new Set<(toasts: ToastItem[]) => void>();

function publishToasts(next: ToastItem[]) {
  liveToasts = next;
  toastListeners.forEach((listener) => listener(liveToasts));
}

function pushToast(toast: ToastInput) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: ToastItem = { ...toast, id, tone: toast.tone ?? "info" };
  publishToasts([...liveToasts.slice(-2), item]);
  window.setTimeout(() => {
    publishToasts(liveToasts.filter((current) => current.id !== id));
  }, 8000);
}

function ToastIcon({ tone }: { tone: FeedbackTone }) {
  if (tone === "success") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (tone === "error" || tone === "warning") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
    </svg>
  );
}

const toastCardClass: Record<FeedbackTone, string> = {
  success:
    "border border-teal-700 bg-teal-800 text-white shadow-2xl shadow-teal-950/40",
  warning:
    "border border-amber-600 bg-amber-700 text-white shadow-2xl shadow-amber-950/40",
  error: "border border-red-700 bg-red-800 text-white shadow-2xl shadow-red-950/40",
  info: "border border-zinc-700 bg-zinc-900 text-white shadow-2xl shadow-black/40",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>(liveToasts);

  useEffect(() => {
    toastListeners.add(setToasts);
    setToasts(liveToasts);
    return () => {
      toastListeners.delete(setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    publishToasts(liveToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    pushToast(toast);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[80] flex flex-col items-center gap-2 px-3"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto w-full max-w-md rounded-2xl px-3.5 py-3 ${toastCardClass[toast.tone]}`}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white"
              >
                <ToastIcon tone={toast.tone} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{formatHeadingCase(toast.title)}</p>
                {toast.body ? <p className="mt-1 text-sm leading-relaxed text-white/90">{toast.body}</p> : null}
                {toast.href ? (
                  <Link
                    href={toast.href}
                    className="mt-2 inline-flex text-sm font-semibold text-white underline decoration-white/50 underline-offset-2"
                    onClick={() => dismiss(toast.id)}
                  >
                    {toast.hrefLabel ?? "View alerts"}
                  </Link>
                ) : null}
              </div>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): { showToast: (toast: ToastInput) => void } {
  const context = useContext(ToastContext);
  return context ?? { showToast: pushToast };
}
