import type { RequirementApprovalStatus } from "@/lib/panelist-requirements";
import { requirementStatusLabel } from "@/lib/panelist-requirements";

function badgeClass(status: RequirementApprovalStatus): string {
  if (status === "approved") return "bg-teal-100 text-teal-900 ring-1 ring-teal-200";
  if (status === "under_review") return "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
  return "bg-red-100 text-red-800 ring-1 ring-red-200";
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
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${badgeClass(status)} ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
      }`}
      title={`${label}: ${requirementStatusLabel(status)}`}
    >
      {compact ? label.charAt(0) : label}
      {!compact ? `: ${requirementStatusLabel(status)}` : null}
    </span>
  );
}

export function RequirementStatusGroup({
  email,
  phone,
  photoId,
  compact = false,
}: {
  email: RequirementApprovalStatus;
  phone: RequirementApprovalStatus;
  photoId: RequirementApprovalStatus;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap ${compact ? "gap-1" : "gap-1.5"}`}>
      <RequirementStatusBadge label="Email" status={email} compact={compact} />
      <RequirementStatusBadge label="Phone" status={phone} compact={compact} />
      <RequirementStatusBadge label="ID" status={photoId} compact={compact} />
    </div>
  );
}
