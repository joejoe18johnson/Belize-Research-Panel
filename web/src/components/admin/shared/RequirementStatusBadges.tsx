import type { RequirementApprovalStatus } from "@/lib/panelist-requirements";
import { VerificationStatusMark, type VerificationMarkStatus } from "@/components/shared/VerificationStatusMark";

function requirementDisplayLabel(status: RequirementApprovalStatus): string {
  if (status === "approved") return "Verified";
  if (status === "under_review") return "Under review";
  if (status === "denied") return "Denied";
  return "Not submitted";
}

function toMarkStatus(status: RequirementApprovalStatus): VerificationMarkStatus {
  if (status === "approved" || status === "denied" || status === "under_review") return status;
  return "missing";
}

function chipClass(status: RequirementApprovalStatus): string {
  if (status === "approved") {
    return "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-50";
  }
  if (status === "denied") {
    return "border-red-300 bg-red-50 text-red-950 dark:border-red-600 dark:bg-red-950 dark:text-red-50";
  }
  if (status === "under_review") {
    return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-50";
  }
  return "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";
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
  const displayLabel = requirementDisplayLabel(status);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5" title={`${label}: ${displayLabel}`}>
        <VerificationStatusMark status={toMarkStatus(status)} size="sm" />
        <span className="text-[11px] leading-tight">
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">{label}</span>
          <span className="text-zinc-500 dark:text-zinc-300"> · </span>
          <span className="font-semibold">{displayLabel}</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 ${chipClass(status)}`}
      title={`${label}: ${displayLabel}`}
    >
      <VerificationStatusMark status={toMarkStatus(status)} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs font-semibold">{displayLabel}</span>
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
  const items = [
    { label: "Email", status: email },
    { label: "Phone", status: phone },
    { label: "ID", status: photoId },
  ];

  if (iconsOnly) {
    return (
      <div className="inline-flex items-center gap-1.5" role="group" aria-label="Email, phone, and ID verification status">
        {items.map((item) => (
          <span key={item.label} title={`${item.label}: ${requirementDisplayLabel(item.status)}`} className="inline-flex">
            <VerificationStatusMark status={toMarkStatus(item.status)} size="sm" />
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
      {items.map((item) => (
        <RequirementStatusBadge key={item.label} label={item.label} status={item.status} compact={compact} />
      ))}
    </div>
  );
}
