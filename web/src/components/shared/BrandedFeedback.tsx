"use client";

import type { ReactNode } from "react";
import {
  brandedAlertIconWrapClass,
  brandedAlertSurfaceClass,
  brandedModalFooterClass,
  brandedModalHeaderClass,
  brandedModalOverlayClass,
  brandedModalPanelClass,
  type FeedbackTone,
} from "@/lib/site-alerts";
import { formatHeadingCase, formatSiteText } from "@/lib/sentence-case";

function FeedbackIcon({ tone }: { tone: FeedbackTone }) {
  if (tone === "success") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (tone === "error") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    );
  }
  if (tone === "warning") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function BrandedAlert({
  tone = "info",
  title,
  children,
  className = "",
  compact = false,
  showIcon = true,
}: {
  tone?: FeedbackTone;
  title?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  showIcon?: boolean;
}) {
  return (
    <div
      className={`rounded-xl text-sm ${brandedAlertSurfaceClass[tone]} ${compact ? "px-3 py-2.5" : "px-4 py-3.5"} ${className}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className={`flex ${showIcon ? "gap-3" : ""}`}>
        {showIcon ? (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${brandedAlertIconWrapClass[tone]}`}
          >
            <FeedbackIcon tone={tone} />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? <p className="font-semibold">{formatHeadingCase(title)}</p> : null}
          <div className={title ? "mt-1 leading-relaxed opacity-90" : "leading-relaxed"}>{formatSiteText(children)}</div>
        </div>
      </div>
    </div>
  );
}

export function BrandedModal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = "lg",
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}) {
  if (!open) return null;

  const widthClass =
    size === "sm" ? "max-w-md" : size === "md" ? "max-w-lg" : "max-w-2xl";

  return (
    <div
      className={brandedModalOverlayClass}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      onClick={onClose}
    >
      <div
        className={`${brandedModalPanelClass} ${widthClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={brandedModalHeaderClass}>
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{eyebrow}</p>
            ) : null}
            <h2 className={`font-semibold text-teal-950 ${eyebrow ? "mt-0.5 text-lg" : "text-lg"}`}>
              {formatHeadingCase(title)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-teal-700/70 transition hover:bg-teal-100 hover:text-teal-900"
            aria-label="Close"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className={brandedModalFooterClass}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function BrandedConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "warning",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "warning" | "error";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmClass =
    tone === "error"
      ? "inline-flex min-h-11 items-center rounded-xl bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
      : "inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60";

  return (
    <BrandedModal
      open={open}
      onClose={onCancel}
      title={title}
      eyebrow="Confirm action"
      size="sm"
      footer={
        <>
          <button type="button" disabled={loading} onClick={onConfirm} className={confirmClass}>
            {loading ? "Working…" : formatHeadingCase(confirmLabel)}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-5 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60"
          >
            {formatHeadingCase(cancelLabel)}
          </button>
        </>
      }
    >
      <BrandedAlert tone={tone} showIcon>
        {description}
      </BrandedAlert>
    </BrandedModal>
  );
}
