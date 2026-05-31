import Link from "next/link";
import type { ReactNode } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { DashboardNavBadges } from "@/lib/dashboard-access";
import { appContentClass, MEDIUM_CONTENT_MAX } from "@/lib/layout-widths";
import { formatHeadingCase, formatHeadingChildren } from "@/lib/sentence-case";
import { DashboardNav } from "./DashboardNav";
import { AccountNotVerifiedBanner } from "./AccountNotVerifiedBanner";
import { isAccountVerified } from "./VerifiedCheckBadge";
import { NotificationBellLink } from "./NotificationBellLink";
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
    <div className="min-h-screen bg-zinc-100">
      <header className="safe-top sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className={`${CONTENT_CLASS} flex min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4`}>
          <BrpLogoLink
            href="/dashboard"
            variant="light"
            className="min-w-0"
            logoClassName="h-7 max-w-[9rem] sm:h-10 sm:max-w-none"
          />
          <div className="flex shrink-0 items-center gap-1 text-sm sm:gap-3">
            <NotificationBellLink unreadCount={badges.unreadNotifications} />
            <Link
              href="/dashboard/profile"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-xl transition hover:bg-zinc-100 sm:min-h-11 sm:min-w-11 md:min-w-0 md:gap-2.5"
              aria-label="View profile"
            >
              <UserAvatar firstName={firstName} email={email} />
              <div className="hidden min-w-0 md:block">
                {firstName.trim() ? (
                  <p className="truncate font-medium text-zinc-900">{firstName}</p>
                ) : null}
                <p className="truncate text-xs text-zinc-500">{email}</p>
              </div>
            </Link>
            <LogoutButton className="flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60 sm:min-h-11 sm:px-4 sm:text-sm" />
          </div>
        </div>
        <DashboardNav badges={badges} />
      </header>
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
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl md:text-3xl">
          {formatHeadingCase(title)}
        </h1>
        {description ? (
          <p className={`mt-2 ${MEDIUM_CONTENT_MAX} text-sm leading-relaxed text-zinc-600`}>{formatHeadingCase(description)}</p>
        ) : null}
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
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
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
    <h3 className="border-b border-zinc-100 pb-3 text-base font-semibold text-zinc-900">
      {formatHeadingChildren(children)}
    </h3>
  );
}

export function SectionHeading({
  children,
  className = "text-base font-semibold text-zinc-900",
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
    <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-600">
      {typeof children === "string" ? formatHeadingCase(children) : children}
    </p>
  );
}

export function DashboardAlert({
  tone = "success",
  title,
  children,
}: {
  tone?: "success" | "info";
  title: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === "info"
      ? "border-teal-200 bg-teal-50 text-teal-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <div className={`rounded-xl border px-4 py-3.5 text-sm ${toneClass}`} role="status">
      <p className="font-semibold">{formatHeadingCase(title)}</p>
      <div className="mt-1 leading-relaxed opacity-90">{children}</div>
    </div>
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "info"
          ? "border-teal-200 bg-teal-50 text-teal-800"
          : "border-zinc-200 bg-zinc-50 text-zinc-700";

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
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning";
  icon?: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50/80"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50/80"
        : "border-zinc-200 bg-white";

  const iconToneClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-teal-50 text-teal-700";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-800">{formatHeadingCase(label)}</p>
        {icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconToneClass}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">{formatHeadingCase(hint)}</p> : null}
    </div>
  );
}

export function ProfileField({ label, value }: { label: string; value: string }) {
  if (!value || value === "Not provided") return null;

  return (
    <div>
      <dt className="text-sm font-medium text-zinc-800">{formatHeadingCase(label)}</dt>
      <dd className="mt-1 text-sm text-zinc-600">{value}</dd>
    </div>
  );
}

export function InterestList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-medium text-zinc-800">{formatHeadingCase(title)}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900"
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
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40 hover:shadow-md"
    >
      <p className="text-sm font-semibold text-teal-800 group-hover:text-teal-900">{formatHeadingCase(label)}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{formatHeadingCase(description)}</p>
    </Link>
  );
}
