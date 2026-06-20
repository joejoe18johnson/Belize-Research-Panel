"use client";

import { formatHeadingCase } from "@/lib/sentence-case";

export function BrandedPdfActions({
  viewHref,
  compact = false,
  viewLabel = "View PDF",
  downloadLabel = "Download",
}: {
  viewHref: string;
  compact?: boolean;
  viewLabel?: string;
  downloadLabel?: string;
}) {
  const downloadHref = viewHref.includes("?") ? `${viewHref}&download=1` : `${viewHref}?download=1`;

  return (
    <div className={`flex ${compact ? "flex-col gap-1.5" : "flex-wrap gap-2"}`}>
      <a
        href={viewHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 font-semibold text-teal-800 hover:bg-teal-100 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200 dark:hover:bg-teal-950/60 ${
          compact ? "px-2.5 py-1.5 text-xs" : "min-h-9 px-3 py-2 text-xs"
        }`}
      >
        <PdfIcon />
        {formatHeadingCase(viewLabel)}
      </a>
      <a
        href={downloadHref}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
          compact ? "px-2.5 py-1.5 text-xs" : "min-h-9 px-3 py-2 text-xs"
        }`}
      >
        <DownloadIcon />
        {formatHeadingCase(downloadLabel)}
      </a>
    </div>
  );
}

function PdfIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path
        d="M4 2.5h5.2L12 5.3V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M9 2.5V6H12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M8 2.5v7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 7 8 9.5 10.5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 12.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
