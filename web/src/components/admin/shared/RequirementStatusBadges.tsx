import type { RequirementApprovalStatus } from "@/lib/panelist-requirements";

type RequirementKind = "email" | "phone" | "id";

const REQUIREMENT_KINDS: Record<string, RequirementKind> = {
  Email: "email",
  Phone: "phone",
  ID: "id",
};

function requirementDisplayLabel(status: RequirementApprovalStatus): string {
  if (status === "approved") return "Verified";
  if (status === "under_review") return "Under review";
  if (status === "denied") return "Denied";
  return "Not submitted";
}

function statusTextClass(status: RequirementApprovalStatus): string {
  if (status === "approved") return "text-emerald-600";
  if (status === "under_review") return "text-amber-700";
  if (status === "denied") return "text-red-700";
  return "text-zinc-500 dark:text-zinc-400 dark:text-zinc-500";
}

function RequirementGlyph({ kind, size }: { kind: RequirementKind; size: number }) {
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  if (kind === "email") {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
        <path {...stroke} d="M2.5 4.5h11v7h-11v-7Z" />
        <path {...stroke} d="M2.5 5.5 8 9l5.5-3.5" />
      </svg>
    );
  }

  if (kind === "phone") {
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
        <path
          {...stroke}
          d="M6.5 2h3a1 1 0 0 1 1 1v1.5M6.5 2v1.5h3M6.5 2H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4.5h-.5"
        />
        <path {...stroke} d="M7.25 12.25h1.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path {...stroke} d="M4.5 3.5h7a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11V5a1.5 1.5 0 0 1 1.5-1.5Z" />
      <circle cx="8" cy="6.25" r="1.35" fill="currentColor" stroke="none" />
      <path {...stroke} d="M5.75 10.25c.55-.9 1.45-1.35 2.25-1.35s1.7.45 2.25 1.35" />
    </svg>
  );
}

function StatusCircleIcon({
  kind,
  status,
  size = "sm",
}: {
  kind: RequirementKind;
  status: RequirementApprovalStatus;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  const iconSize = size === "sm" ? 10 : 11;

  const toneClass =
    status === "approved"
      ? "bg-emerald-500 text-white"
      : status === "under_review"
        ? "bg-amber-500 text-white"
        : status === "denied"
          ? "bg-red-500 text-white"
          : "bg-zinc-400 text-white";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${toneClass} ${sizeClass}`}
      aria-hidden="true"
    >
      <RequirementGlyph kind={kind} size={iconSize} />
    </span>
  );
}

export function RequirementStatusBadge({
  label,
  status,
  compact = false,
}: {
  label: string;
  status: RequirementApprovalStatus;
  compact?: boolean;
}) {
  const kind = REQUIREMENT_KINDS[label] ?? "email";
  const displayLabel = requirementDisplayLabel(status);

  return (
    <span
      className={`inline-flex items-center ${compact ? "gap-1.5" : "gap-2"}`}
      title={`${label}: ${displayLabel}`}
    >
      <StatusCircleIcon kind={kind} status={status} size={compact ? "sm" : "md"} />
      <span
        className={`font-medium ${statusTextClass(status)} ${
          compact ? "text-[11px] leading-tight" : "text-xs"
        }`}
      >
        {compact ? (
          <>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
            <span className="text-zinc-400 dark:text-zinc-500"> · </span>
            {displayLabel}
          </>
        ) : (
          <>
            {label}
            <span className="text-zinc-400 dark:text-zinc-500"> · </span>
            {displayLabel}
          </>
        )}
      </span>
    </span>
  );
}

export function RequirementStatusGroup({
  email,
  phone,
  photoId,
  compact = false,
  iconsOnly = false,
}: {
  email: RequirementApprovalStatus;
  phone: RequirementApprovalStatus;
  photoId: RequirementApprovalStatus;
  compact?: boolean;
  iconsOnly?: boolean;
}) {
  if (iconsOnly) {
    const items = [
      { label: "Email", kind: "email" as const, status: email },
      { label: "Phone", kind: "phone" as const, status: phone },
      { label: "ID", kind: "id" as const, status: photoId },
    ];

    return (
      <div className="inline-flex items-center gap-1.5" role="group" aria-label="Email, phone, and ID verification status">
        {items.map((item) => (
          <span
            key={item.label}
            title={`${item.label}: ${requirementDisplayLabel(item.status)}`}
            className="inline-flex"
          >
            <StatusCircleIcon kind={item.kind} status={item.status} size="sm" />
            <span className="sr-only">
              {item.label}: {requirementDisplayLabel(item.status)}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex ${compact ? "flex-col gap-1" : "flex-wrap gap-2"}`}>
      <RequirementStatusBadge label="Email" status={email} compact={compact} />
      <RequirementStatusBadge label="Phone" status={phone} compact={compact} />
      <RequirementStatusBadge label="ID" status={photoId} compact={compact} />
    </div>
  );
}
