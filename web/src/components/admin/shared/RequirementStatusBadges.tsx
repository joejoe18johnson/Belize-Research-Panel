import type { RequirementApprovalStatus } from "@/lib/panelist-requirements";

type RequirementLetter = "E" | "P" | "I";

const REQUIREMENT_LETTERS: Record<string, RequirementLetter> = {
  Email: "E",
  Phone: "P",
  ID: "I",
};

function requirementDisplayLabel(status: RequirementApprovalStatus): string {
  if (status === "approved") return "Verified";
  if (status === "under_review") return "Under review";
  return "Not submitted";
}

function statusTextClass(status: RequirementApprovalStatus): string {
  if (status === "approved") return "text-emerald-600";
  if (status === "under_review") return "text-amber-700";
  return "text-zinc-500";
}

function StatusCircleIcon({
  letter,
  status,
  size = "sm",
}: {
  letter: RequirementLetter;
  status: RequirementApprovalStatus;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  const iconSize = size === "sm" ? 10 : 11;
  const letterClass = size === "sm" ? "text-[9px]" : "text-[10px]";

  if (status === "approved") {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white ${sizeClass}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" width={iconSize} height={iconSize} fill="none">
          <path
            d="M3.5 8.2 6.4 11 12.5 4.8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  if (status === "missing") {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-400 text-white ${sizeClass}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 16 16" width={iconSize} height={iconSize} fill="none">
          <path
            d="M5 5l6 6M11 5l-6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-white ${sizeClass} ${letterClass}`}
      aria-hidden="true"
    >
      {letter}
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
  const letter = REQUIREMENT_LETTERS[label] ?? "E";
  const displayLabel = requirementDisplayLabel(status);

  return (
    <span
      className={`inline-flex items-center ${compact ? "gap-1.5" : "gap-2"}`}
      title={`${label}: ${displayLabel}`}
    >
      <StatusCircleIcon letter={letter} status={status} size={compact ? "sm" : "md"} />
      <span
        className={`font-medium ${statusTextClass(status)} ${
          compact ? "text-[11px] leading-tight" : "text-xs"
        }`}
      >
        {compact ? (
          status === "under_review" ? (
            displayLabel
          ) : (
            <>
              <span className="font-semibold text-zinc-600">{letter}</span>
              <span className="text-zinc-400"> · </span>
              {displayLabel}
            </>
          )
        ) : (
          <>
            {label}
            <span className="text-zinc-400"> · </span>
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
      { label: "Email", letter: "E" as const, status: email },
      { label: "Phone", letter: "P" as const, status: phone },
      { label: "ID", letter: "I" as const, status: photoId },
    ];

    return (
      <div className="inline-flex items-center gap-1.5" role="group" aria-label="Email, phone, and ID verification status">
        {items.map((item) => (
          <span
            key={item.label}
            title={`${item.label}: ${requirementDisplayLabel(item.status)}`}
            className="inline-flex"
          >
            <StatusCircleIcon letter={item.letter} status={item.status} size="sm" />
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
