"use client";

import { useEffect, useState } from "react";
import { BrandedAlert, BrandedModal } from "@/components/shared/BrandedFeedback";
import {
  adminDeleteConfirmationHint,
  matchesDeleteConfirmation,
  normalizeDeleteConfirmationInput,
} from "@/lib/admin-delete-confirmation";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminDeleteConfirmDialog({
  open,
  title,
  description,
  confirmCode,
  confirmLabel = "Delete record",
  cancelLabel = "Keep record",
  loading = false,
  error,
  success,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmCode: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string;
  success?: string;
  onConfirm: (confirmCode: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const matches = matchesDeleteConfirmation(input, confirmCode);
  const busy = loading || submitting;

  useEffect(() => {
    if (!open) {
      setInput("");
      setSubmitting(false);
    }
  }, [open, confirmCode]);

  const handleConfirm = async () => {
    if (busy || !matches) return;
    setSubmitting(true);
    try {
      await onConfirm(normalizeDeleteConfirmationInput(input));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BrandedModal
      open={open}
      onClose={busy ? () => undefined : onCancel}
      title={success ? "Record deleted" : title}
      eyebrow={success ? "Confirmed" : "Confirm deletion"}
      size="sm"
      footer={
        success ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {formatHeadingCase("Done")}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy || !matches}
              onClick={() => void handleConfirm()}
              className="inline-flex min-h-11 items-center rounded-xl bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {busy ? "Deleting…" : formatHeadingCase(confirmLabel)}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-5 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60 dark:border-teal-800 dark:bg-zinc-900 dark:text-teal-200 dark:hover:bg-teal-900/40"
            >
              {formatHeadingCase(cancelLabel)}
            </button>
          </>
        )
      }
    >
      {success ? (
        <BrandedAlert tone="success" title="The record has been successfully deleted" showIcon>
          {success}
        </BrandedAlert>
      ) : (
        <div className="space-y-4">
          <BrandedAlert tone="error" showIcon>
            {description}
          </BrandedAlert>
          {error ? (
            <BrandedAlert tone="error" title="Could not delete record" showIcon>
              {error}
            </BrandedAlert>
          ) : null}
          <div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {formatHeadingCase(adminDeleteConfirmationHint(confirmCode))}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Use the panelist&apos;s first name and registration year with no spaces (for example,{" "}
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{confirmCode}</span>).
            </p>
            <label className="mt-3 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {formatHeadingCase("Confirmation code")}
            </label>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              placeholder={confirmCode}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 font-mono text-sm text-zinc-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-100"
            />
            {input && !matches ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                Code does not match. Enter {confirmCode} exactly.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </BrandedModal>
  );
}
