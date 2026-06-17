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
  onConfirm: (confirmCode: string) => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const matches = matchesDeleteConfirmation(input, confirmCode);

  useEffect(() => {
    if (!open) setInput("");
  }, [open, confirmCode]);

  return (
    <BrandedModal
      open={open}
      onClose={onCancel}
      title={title}
      eyebrow="Confirm deletion"
      size="sm"
      footer={
        <>
          <button
            type="button"
            disabled={loading || !matches}
            onClick={() => onConfirm(normalizeDeleteConfirmationInput(input))}
            className="inline-flex min-h-11 items-center rounded-xl bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
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
      <div className="space-y-4">
        <BrandedAlert tone="error" showIcon>
          {description}
        </BrandedAlert>
        <div>
          <p className="text-sm text-zinc-700">{formatHeadingCase(adminDeleteConfirmationHint(confirmCode))}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Use the panelist&apos;s first name and registration year with no spaces (for example,{" "}
            <span className="font-mono font-semibold text-zinc-700">{confirmCode}</span>).
          </p>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {formatHeadingCase("Confirmation code")}
          </label>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={confirmCode}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 font-mono text-sm text-zinc-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
          {input && !matches ? (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              Code does not match. Enter {confirmCode} exactly.
            </p>
          ) : null}
        </div>
      </div>
    </BrandedModal>
  );
}
