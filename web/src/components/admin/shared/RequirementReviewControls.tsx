"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminRequirementDecision, RequirementApprovalStatus } from "@/lib/panelist-requirements";
import { RequirementStatusBadge } from "./RequirementStatusBadges";

type ReviewKey = "email" | "phone" | "photoId";

export interface RequirementReviewDetail {
  email: string;
  phone: string;
  photoIdType: string;
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

    fetch(url, { credentials: "same-origin" })
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
    return <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Not on file — add details before verifying.</p>;
  }

  if (itemKey === "email") {
    return (
      <div className="mt-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-2">
        <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">On file</p>
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
        <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">On file</p>
        <p className="mt-0.5 text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-200">{detail.phone}</p>
        <a
          href={`tel:${detail.phone.replace(/\D/g, "")}`}
          className="mt-1 inline-block text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-100"
        >
          Call / open dialer
        </a>
      </div>
    );
  }

  const photoUrl = photoIdDocumentHref(detail);

  return (
    <div className="mt-2 space-y-2">
      {detail.photoIdType ? (
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-2">
          <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">ID type</p>
          <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{detail.photoIdType}</p>
        </div>
      ) : null}
      {photoUrl ? (
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
  onDecision: (key: ReviewKey, decision: "true" | "false") => void;
  disabled?: boolean;
  itemNotes?: Partial<Record<ReviewKey, string>>;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {REVIEW_ITEMS.map((item) => {
        const decision = decisions[item.key];
        const status = statusFromDecision(onFile[item.key], decision);
        const verified = decision === "true";
        const denied = decision === "false";
        const note = itemNotes?.[item.key];
        const emailLocked = item.key === "email" && verified && Boolean(note);

        return (
          <div key={item.key} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-sm">
            <RequirementStatusBadge label={item.label} status={status} />
            <RequirementOnFileDetail itemKey={item.key} detail={detail} onFile={onFile[item.key]} />
            {note ? <p className="mt-2 text-[11px] leading-snug text-emerald-800 dark:text-emerald-300">{note}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={disabled || !onFile[item.key] || verified}
                onClick={() => onDecision(item.key, "true")}
                className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Verify
              </button>
              <button
                type="button"
                disabled={disabled || !onFile[item.key] || denied || emailLocked}
                onClick={() => onDecision(item.key, "false")}
                className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Deny
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
