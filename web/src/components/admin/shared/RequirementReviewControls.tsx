"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminRequirementDecision, RequirementApprovalStatus } from "@/lib/panelist-requirements";
import { PHOTO_ID_DENY_AFTER_PURGE_MESSAGE } from "@/lib/photo-id-purge-copy";
import { RequirementStatusBadge } from "./RequirementStatusBadges";

type ReviewKey = "email" | "phone" | "photoId";

export interface RequirementReviewDetail {
  email: string;
  phone: string;
  photoIdType: string;
  photoIdDenialReason?: string;
  photoIdDeleted?: boolean;
  photoPreviewSuppressed?: boolean;
  photoIdDocumentUrl?: string;
  residenceDocumentUrl?: string;
}

const REVIEW_ITEMS: Array<{ key: ReviewKey; label: string }> = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "photoId", label: "ID" },
];

function statusFromDecision(
  onFile: boolean,
  decision: AdminRequirementDecision
): RequirementApprovalStatus {
  if (decision === "true") return onFile ? "approved" : "missing";
  if (decision === "false") return onFile ? "denied" : "missing";
  return onFile ? "under_review" : "missing";
}

const WHATSAPP_VERIFICATION_MESSAGE =
  "This is a quick identity verification for our survey panel. Please confirm the initials of the name you used to register. Thank you.";

function whatsAppVerificationHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_VERIFICATION_MESSAGE)}`;
}

function DecisionGlyph({ kind }: { kind: "check" | "x" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      {kind === "check" ? (
        <path d="M3.5 8.2 6.4 11 12.5 4.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function photoIdDocumentHref(detail: RequirementReviewDetail): string {
  if (detail.photoIdDocumentUrl) return detail.photoIdDocumentUrl;
  const email = detail.email.trim();
  if (!email) return "";
  return `/api/admin/panelists/${encodeURIComponent(email)}/document?kind=photo-id`;
}

function ViewDocumentLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
    >
      <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
        <path
          d="M4 2.5h5.2L12 5.3V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M9 2.5V6H12" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      {label}
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden="true" className="opacity-70">
        <path d="M6 3.5h5.5V9M11.5 3.5 6 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </a>
  );
}

function PhotoIdPreview({ url }: { url: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [preview, setPreview] = useState<{ objectUrl: string; type: string } | null>(null);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;
    setStatus("loading");
    setPreview(null);

    const controller = new AbortController();
    fetch(url, { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("missing");
        const type = (response.headers.get("content-type") || "").toLowerCase();
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreview({ objectUrl, type });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (status === "loading") {
    return <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Loading uploaded ID…</p>;
  }

  if (status === "missing" || !preview) {
    return (
      <div className="space-y-2">
        <p className="text-[11px] text-amber-800 dark:text-amber-300">
          Preview unavailable. Open the ID document to view it.
        </p>
        <ViewDocumentLink href={url} label="Open ID document" />
      </div>
    );
  }

  const isImage = preview.type.startsWith("image/");
  const isPdf = preview.type.includes("pdf");

  return (
    <div className="space-y-2">
      {isImage ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.objectUrl} alt="Uploaded photo ID" className="max-h-80 w-full object-contain" />
        </div>
      ) : isPdf ? (
        <iframe
          src={preview.objectUrl}
          title="Uploaded photo ID"
          className="h-80 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100"
        />
      ) : null}
      <ViewDocumentLink href={url} label="Open ID document" />
    </div>
  );
}

function RequirementOnFileDetail({
  itemKey,
  detail,
  onFile,
}: {
  itemKey: ReviewKey;
  detail: RequirementReviewDetail;
  onFile: boolean;
}) {
  if (!onFile) {
    return <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-300">Not on file — add details before verifying.</p>;
  }

  if (itemKey === "email") {
    return (
      <div className="mt-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-2">
        <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">On file</p>
        <p className="mt-0.5 break-all text-sm font-medium text-zinc-800 dark:text-zinc-200">{detail.email}</p>
        <Link
          href={`mailto:${detail.email}`}
          className="mt-1 inline-block text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
        >
          Open in email
        </Link>
      </div>
    );
  }

  if (itemKey === "phone") {
    return (
      <div className="mt-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-2">
        <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">On file</p>
        <p className="mt-0.5 text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{detail.phone}</p>
        <a
          href={whatsAppVerificationHref(detail.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
        >
          Message on WhatsApp
        </a>
      </div>
    );
  }

  const photoUrl = photoIdDocumentHref(detail);

  return (
    <div className="mt-2 space-y-2">
      {detail.photoIdType ? (
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-2">
          <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">ID type</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{detail.photoIdType}</p>
        </div>
      ) : null}
      {detail.photoPreviewSuppressed ? (
        <p className="text-[11px] leading-snug text-zinc-700 dark:text-zinc-200">Saving this verification…</p>
      ) : detail.photoIdDeleted ? (
        <p className="text-[11px] leading-snug text-zinc-800 dark:text-zinc-100">{PHOTO_ID_DENY_AFTER_PURGE_MESSAGE}</p>
      ) : photoUrl ? (
        <PhotoIdPreview url={photoUrl} />
      ) : (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">No panelist email on this record, so the ID file cannot be loaded.</p>
      )}
      {detail.residenceDocumentUrl ? (
        <ViewDocumentLink href={detail.residenceDocumentUrl} label="View address proof" />
      ) : null}
    </div>
  );
}

export function RequirementReviewControls({
  decisions,
  onFile,
  detail,
  onDecision,
  disabled = false,
  itemNotes,
}: {
  decisions: Record<ReviewKey, AdminRequirementDecision>;
  onFile: Record<ReviewKey, boolean>;
  detail: RequirementReviewDetail;
  onDecision: (key: ReviewKey, decision: "true" | "false", reason?: string) => void;
  disabled?: boolean;
  itemNotes?: Partial<Record<ReviewKey, string>>;
}) {
  const [photoDenialOpen, setPhotoDenialOpen] = useState(false);
  const [photoDenialReason, setPhotoDenialReason] = useState(detail.photoIdDenialReason ?? "");
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {REVIEW_ITEMS.map((item) => {
        const decision = decisions[item.key];
        const status = statusFromDecision(onFile[item.key], decision);
        const verified = decision === "true";
        const denied = decision === "false";
        const note = itemNotes?.[item.key];
        const emailLocked = item.key === "email" && verified && Boolean(note);
        const photoLocked = item.key === "photoId" && Boolean(detail.photoIdDeleted);

        return (
          <div key={item.key} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-sm">
            <RequirementStatusBadge label={item.label} status={status} />
            <RequirementOnFileDetail itemKey={item.key} detail={detail} onFile={onFile[item.key]} />
            {note ? <p className="mt-2 text-[11px] leading-snug text-emerald-800 dark:text-emerald-300">{note}</p> : null}
            {item.key === "photoId" && denied && !photoDenialOpen ? (
              <div className="mt-2">
                <p className="text-[11px] leading-snug text-red-900 dark:text-red-100">
                  {detail.photoIdDenialReason
                    ? `Reason sent to the panelist: ${detail.photoIdDenialReason}`
                    : "Add the reason the panelist will see."}
                </p>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setPhotoDenialReason(detail.photoIdDenialReason ?? "");
                    setPhotoDenialOpen(true);
                  }}
                  className="mt-1 text-[11px] font-semibold text-red-800 underline underline-offset-2 dark:text-red-200"
                >
                  Change reason
                </button>
              </div>
            ) : null}
            {item.key === "photoId" && photoDenialOpen ? (
              <div className="mt-3 space-y-2">
                <label htmlFor="photo-id-denial-reason" className="block text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
                  Why was this document not approved?
                </label>
                <textarea
                  id="photo-id-denial-reason"
                  rows={3}
                  maxLength={400}
                  value={photoDenialReason}
                  onChange={(event) => setPhotoDenialReason(event.target.value)}
                  placeholder="For example: the name was covered, or the photo was too blurry to read."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-900 placeholder:text-zinc-500 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400"
                />
                <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">
                  The panelist sees this reason and can submit another document.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={disabled || !photoDenialReason.trim()}
                    onClick={() => {
                      onDecision(item.key, "false", photoDenialReason.trim());
                      setPhotoDenialOpen(false);
                    }}
                    className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-red-700 px-3 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-white"
                  >
                    {denied ? "Save reason" : "Confirm denial"}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setPhotoDenialReason(detail.photoIdDenialReason ?? "");
                      setPhotoDenialOpen(false);
                    }}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {item.key === "photoId" && photoDenialOpen ? null : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled || !onFile[item.key] || verified}
                onClick={() => onDecision(item.key, "true")}
                className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed ${
                  verified
                    ? "bg-emerald-600 text-white"
                    : "border border-emerald-700 bg-white text-emerald-900 hover:bg-emerald-50 disabled:border-zinc-400 disabled:bg-zinc-200 disabled:text-zinc-700 dark:border-emerald-400 dark:bg-zinc-950 dark:text-emerald-50 dark:hover:bg-emerald-950 dark:disabled:border-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-200"
                }`}
              >
                {verified ? <DecisionGlyph kind="check" /> : null}
                {verified ? "Verified" : "Verify"}
              </button>
              <button
                type="button"
                disabled={disabled || !onFile[item.key] || denied || emailLocked || photoLocked}
                aria-label={photoLocked ? PHOTO_ID_DENY_AFTER_PURGE_MESSAGE : denied ? "Denied" : "Deny"}
                onClick={() => {
                  if (item.key === "photoId") {
                    setPhotoDenialReason(detail.photoIdDenialReason ?? "");
                    setPhotoDenialOpen(true);
                    return;
                  }
                  onDecision(item.key, "false");
                }}
                className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed ${
                  denied
                    ? "bg-red-600 text-white"
                    : "border border-red-700 bg-white text-red-900 hover:bg-red-50 disabled:border-zinc-400 disabled:bg-zinc-200 disabled:text-zinc-700 dark:border-red-400 dark:bg-zinc-950 dark:text-red-50 dark:hover:bg-red-950 dark:disabled:border-zinc-600 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-200"
                }`}
              >
                {denied ? <DecisionGlyph kind="x" /> : null}
                {denied ? "Denied" : "Deny"}
              </button>
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
