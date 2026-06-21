"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { siteCheckboxClass } from "@/lib/site-controls";
import {
  adminNewRowHighlightClass,
  adminTableHeadRowClass,
  docPillClass,
  filterOptionHoverClass,
  iconMetricToneClass,
  statusPillClass,
} from "@/lib/theme-surfaces";
import { formatAdminLabel, formatHeadingCase, formatHeadingChildren } from "@/lib/sentence-case";

/** Form and filter labels in the admin console (title case, not all caps). */
export const adminFieldLabelClass = "text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500";

export function AdminFieldLabel({ children }: { children: ReactNode }) {
  return <span className={adminFieldLabelClass}>{formatHeadingChildren(children)}</span>;
}

export function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
  counts,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  counts?: Record<string, number>;
}) {
  return (
    <div>
      <p className={adminFieldLabelClass}>{formatAdminLabel(label)}</p>
      <div className="mt-1.5 max-h-36 space-y-0.5 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
        {options.length === 0 ? (
          <p className="px-2 py-1 text-xs text-zinc-400 dark:text-zinc-500">None</p>
        ) : (
          options.map((option) => {
            const checked = selected.includes(option);
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 ${filterOptionHoverClass}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selected.filter((v) => v !== option) : [...selected, option])
                  }
                  className={`${siteCheckboxClass} shrink-0`}
                />
                <span className="min-w-0 flex-1 truncate">{formatAdminLabel(option)}</span>
                {counts && counts[option] !== undefined ? (
                  <span className="shrink-0 tabular-nums text-xs font-medium text-zinc-400 dark:text-zinc-500">({counts[option]})</span>
                ) : null}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  href,
  active = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  active?: boolean;
}) {
  const className = `block rounded-2xl border bg-white dark:bg-zinc-900 p-4 shadow-sm transition ${
    active
      ? "border-teal-600 ring-2 ring-teal-200 dark:ring-teal-800"
      : href
        ? "border-teal-100 dark:border-teal-900/60 hover:border-teal-300 hover:shadow-md dark:hover:border-teal-700"
        : "border-teal-100 dark:border-teal-900/60"
  }`;

  const content = (
    <>
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatAdminLabel(label)}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-teal-950 dark:text-teal-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? "true" : undefined}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

const ICON_METRIC_TONES = iconMetricToneClass;

export function IconMetricCard({
  href,
  label,
  value,
  hint,
  tone = "teal",
  icon,
}: {
  href?: string;
  label: string;
  value: number | string;
  hint?: string;
  tone?: keyof typeof ICON_METRIC_TONES;
  icon: ReactNode;
}) {
  const content = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ICON_METRIC_TONES[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatAdminLabel(label)}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</p>
        {hint ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{hint}</p> : null}
      </span>
    </>
  );

  const className =
    "flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function AdminStatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "info" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? statusPillClass.success
      : tone === "warning"
        ? statusPillClass.warning
        : tone === "info"
          ? statusPillClass.info
          : statusPillClass.neutral;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}>
      {formatAdminLabel(label)}
    </span>
  );
}

export function AdminDocPill({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={docPillClass}
    >
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
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
    </Link>
  );
}

export { adminTableRowHoverClass, adminTableHeadRowClass } from "@/lib/theme-surfaces";
export const adminTableScrollClass = "table-scroll";
export const adminResponsiveTableClass = "admin-responsive-table";

export function AdminTableScroll({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`admin-table-scroll max-md:overflow-visible ${className}`.trim()}>{children}</div>;
}

export function AdminSectionPanel({
  title,
  viewAllHref,
  children,
}: {
  title: string;
  viewAllHref?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatHeadingCase(title)}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm font-semibold text-sky-700 hover:text-sky-900">
            View all →
          </Link>
        ) : null}
      </div>
      <div className="admin-table-scroll max-md:overflow-visible">{children}</div>
    </section>
  );
}

export function AdminDataTable({
  children,
  className = "",
  desktopMinWidthClass = "",
}: {
  children: ReactNode;
  className?: string;
  /** e.g. md:min-w-[640px] — horizontal scroll only from md breakpoint */
  desktopMinWidthClass?: string;
}) {
  return (
    <table
      className={`${adminResponsiveTableClass} w-full text-left text-sm ${desktopMinWidthClass} ${className}`.trim()}
    >
      {children}
    </table>
  );
}

export function AdminTableRow({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr className={`border-b border-zinc-50 align-top hover:bg-zinc-50/60 dark:border-zinc-800/80 dark:hover:bg-zinc-800/60 ${className}`.trim()} onClick={onClick}>
      {children}
    </tr>
  );
}

export function AdminTableTd({
  label,
  children,
  align = "left",
  className = "",
  colSpan,
  empty = false,
}: {
  label?: string;
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
  empty?: boolean;
}) {
  const alignClass =
    align === "right" ? "md:text-right" : align === "center" ? "md:text-center" : "md:text-left";

  return (
    <td
      colSpan={colSpan}
      data-label={label ?? ""}
      className={`px-4 py-3 ${alignClass} ${empty ? "admin-table-empty" : ""} ${className}`.trim()}
    >
      {children}
    </td>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
        {children}
      </tr>
    </thead>
  );
}

export function AdminTableTh({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <th className={`whitespace-nowrap px-4 py-3 font-semibold ${alignClass}`}>{formatHeadingChildren(children)}</th>;
}

export function AdminDownloadButton({
  label = "Download PDF",
  onClick,
  disabled = false,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
        <path
          d="M4 2.5h5.2L12 5.3V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M9 2.5V6H12" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      {label}
    </button>
  );
}

export function ReviewReasonList({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) {
    return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
  }

  return (
    <ul className="min-w-[11rem] space-y-1.5">
      {reasons.map((reason) => (
        <li key={reason} className="flex items-start gap-2 text-xs leading-snug text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" aria-hidden="true" />
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-l-4 border-teal-600 pl-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">{formatHeadingCase(eyebrow)}</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 dark:text-teal-100 sm:text-3xl">{formatHeadingCase(title)}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(description)}</p>
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto [&_a]:flex [&_a]:w-full [&_a]:justify-center [&_button]:w-full sm:[&_a]:inline-flex sm:[&_a]:w-auto sm:[&_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function adminNewItemRowClass(isNew: boolean, base = ""): string {
  if (!isNew) return base;
  return [base, adminNewRowHighlightClass].filter(Boolean).join(" ");
}

export function AdminNewBadge({ label = "New" }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
      {formatAdminLabel(label)}
    </span>
  );
}
