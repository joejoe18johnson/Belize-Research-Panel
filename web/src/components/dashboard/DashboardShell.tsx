import Link from "next/link";
import type { ReactNode } from "react";
import type { ViewLayout } from "@/lib/view-layout";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { BrpLogoLink } from "@/components/BrpLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { DashboardNavBadges } from "@/lib/dashboard-access";
import { dashboardCardClass, dashboardHeaderClass, dashboardShellClass } from "@/lib/brand";
import { appContentClass, MEDIUM_CONTENT_MAX } from "@/lib/layout-widths";
import { formatHeadingCase, formatHeadingChildren } from "@/lib/sentence-case";
import { DashboardNav } from "./DashboardNav";
import { AccountNotVerifiedBanner } from "./AccountNotVerifiedBanner";
import { isAccountVerified } from "./VerifiedCheckBadge";
import { NotificationBellLink } from "./NotificationBellLink";
import { NewSurveyAlertBanner } from "./NewSurveyAlertBanner";
import { PointsBalanceLink } from "./PointsBalanceLink";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserAvatar } from "./UserAvatar";

const CONTENT_CLASS = appContentClass;

export function DashboardShell({
  email,
  firstName,
  badges,
  verificationStatus,
  children,
}: {
  email: string;
  firstName: string;
  badges: DashboardNavBadges;
  verificationStatus?: string;
  children: ReactNode;
}) {
  return (
    <div className={dashboardShellClass}>
      <header className={dashboardHeaderClass}>
        <div className="h-1 bg-gradient-to-r from-teal-600 via-teal-700 to-teal-900" aria-hidden />
        <div className={`${CONTENT_CLASS} flex min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4`}>
          <BrpLogoLink href="/dashboard" variant="light" className="min-w-0" logoClassName="sm:text-base" />
          <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
            <PointsBalanceLink availablePoints={badges.availablePoints} />
            <NotificationBellLink unreadCount={badges.unreadNotifications} />
            <Link
              href="/dashboard/profile"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-xl transition hover:bg-teal-50 dark:hover:bg-teal-900/40 sm:min-h-11 sm:min-w-11 md:min-w-0 md:gap-2.5"
              aria-label="View profile"
            >
              <UserAvatar firstName={firstName} email={email} />
              <div className="hidden min-w-0 md:block">
                {firstName.trim() ? (
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">{firstName}</p>
                ) : null}
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{email}</p>
              </div>
            </Link>
            <LogoutButton className="flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-2.5 text-xs font-semibold text-teal-900 dark:text-teal-100 shadow-sm transition hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-60 dark:border-teal-800 dark:bg-zinc-900 dark:text-teal-200 dark:hover:border-teal-700 dark:hover:bg-teal-950 sm:min-h-11 sm:px-4 sm:text-sm" />
            <ThemeToggle compact />
          </div>
        </div>
        <DashboardNav badges={badges} />
      </header>
      <NewSurveyAlertBanner newSurveyCount={badges.newSurveys} />
      <main className={`${CONTENT_CLASS} px-3 py-5 sm:px-4 sm:py-8`}>
        {verificationStatus && !isAccountVerified(verificationStatus) ? (
          <div className="mb-6">
            <AccountNotVerifiedBanner verificationStatus={verificationStatus} />
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

export function DashboardPageHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Belize Research Panel</p>
        <div className="mt-1 flex items-start gap-3">
          {icon ? (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-teal-950 dark:text-teal-100 sm:text-2xl md:text-3xl">
              {formatHeadingCase(title)}
            </h1>
            {description ? (
              <p className={`mt-2 ${MEDIUM_CONTENT_MAX} text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500`}>
                {formatHeadingCase(description)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto [&_a]:flex [&_a]:w-full [&_a]:justify-center [&_button]:w-full sm:[&_a]:inline-flex sm:[&_a]:w-auto sm:[&_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${dashboardCardClass} ${className}`.trim()}>{children}</div>;
}

/** Clips top-of-card media (images, gradients) to the card corner radius. */
export function DashboardCardMedia({
  children,
  className = "",
  top = true,
}: {
  children: ReactNode;
  className?: string;
  /** When false, media sits below another block (e.g. locked banner) — no top rounding. */
  top?: boolean;
}) {
  return (
    <div className={`overflow-hidden ${top ? "rounded-t-2xl" : ""} ${className}`.trim()}>{children}</div>
  );
}

export function DashboardCardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-teal-100 dark:border-teal-900/60 pb-3 text-base font-semibold text-teal-950 dark:text-teal-100">
      {formatHeadingChildren(children)}
    </h3>
  );
}

export function SectionHeading({
  children,
  className = "text-base font-semibold text-zinc-900 dark:text-zinc-100",
  as: Tag = "h3",
}: {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3" | "h4";
}) {
  return <Tag className={className}>{formatHeadingChildren(children)}</Tag>;
}

export function DashboardInfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-teal-100 dark:border-teal-900/60 bg-teal-50/60 px-4 py-3 text-sm leading-relaxed text-teal-900/80">
      {typeof children === "string" ? formatHeadingCase(children) : children}
    </p>
  );
}

export function DashboardAlert({
  tone = "success",
  title,
  children,
}: {
  tone?: "success" | "info" | "warning";
  title: string;
  children: ReactNode;
}) {
  return (
    <BrandedAlert tone={tone === "success" ? "success" : tone === "warning" ? "warning" : "info"} title={title}>
      {children}
    </BrandedAlert>
  );
}

export function StatusBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "border-teal-300 bg-teal-50 text-teal-800 dark:text-teal-200"
      : tone === "warning"
        ? "border-teal-300/70 bg-teal-50 text-teal-800 dark:text-teal-200"
        : tone === "info"
          ? "border-teal-200 bg-teal-50 text-teal-800 dark:text-teal-200"
          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
  layout = "cards",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning";
  icon?: ReactNode;
  layout?: ViewLayout;
}) {
  const toneClass =
    tone === "success"
      ? "border-teal-200 bg-teal-50/90 shadow-sm shadow-teal-950/[0.04]"
      : tone === "warning"
        ? "border-teal-200 bg-teal-50/80 shadow-sm shadow-teal-950/[0.04]"
        : "border-teal-100 dark:border-teal-900/60 bg-white dark:bg-zinc-900 shadow-sm shadow-teal-950/[0.03]";

  const iconToneClass =
    tone === "success"
      ? "bg-teal-100 text-teal-700"
      : tone === "warning"
        ? "bg-teal-100 text-teal-700 ring-2 ring-amber-200/70"
        : "bg-teal-50 text-teal-700";

  if (layout === "list") {
    return (
      <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
        <div className="flex items-center gap-3">
          {icon ? (
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconToneClass}`}>
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(label)}</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
            {hint ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(hint)}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatHeadingCase(label)}</p>
        {icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconToneClass}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(hint)}</p> : null}
    </div>
  );
}

export function ProfileField({ label, value }: { label: string; value: string }) {
  if (!value || value === "Not provided") return null;

  return (
    <div>
      <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatHeadingCase(label)}</dt>
      <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{value}</dd>
    </div>
  );
}

export function InterestList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatHeadingCase(title)}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900 dark:text-teal-100"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function QuickLinkCard({
  href,
  label,
  description,
  icon,
  layout = "cards",
  variant = "horizontal",
}: {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  layout?: ViewLayout;
  /** Stacked icon above text — better for overview quick-link grids. */
  variant?: "horizontal" | "stacked";
}) {
  if (layout === "list") {
    return (
      <Link
        href={href}
        className="group flex h-full items-center gap-3 rounded-2xl border border-teal-100 dark:border-teal-900/60 bg-white dark:bg-zinc-900 p-4 shadow-sm transition hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 group-hover:text-teal-950 dark:text-teal-100">{formatHeadingCase(label)}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(description)}</p>
        </div>
      </Link>
    );
  }

  if (variant === "stacked") {
    return (
      <Link
        href={href}
        className="group flex h-full flex-col rounded-2xl border border-teal-100 dark:border-teal-900/60 bg-white dark:bg-zinc-900 p-4 shadow-sm shadow-teal-950/[0.03] transition hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50 hover:shadow-md hover:shadow-teal-950/10 sm:p-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition group-hover:bg-teal-100 group-hover:text-teal-800 dark:text-teal-200">
          {icon}
        </span>
        <div className="mt-3 min-w-0 flex-1">
          <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 group-hover:text-teal-950 dark:text-teal-100">{formatHeadingCase(label)}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(description)}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex h-full rounded-2xl border border-teal-100 dark:border-teal-900/60 bg-white dark:bg-zinc-900 p-5 shadow-sm shadow-teal-950/[0.03] transition hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50/50 hover:shadow-md hover:shadow-teal-950/10"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 transition group-hover:bg-teal-100 group-hover:text-teal-800 dark:text-teal-200">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 group-hover:text-teal-950 dark:text-teal-100">{formatHeadingCase(label)}</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(description)}</p>
        </div>
      </div>
    </Link>
  );
}
