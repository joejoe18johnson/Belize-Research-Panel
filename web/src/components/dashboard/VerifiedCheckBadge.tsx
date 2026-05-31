import { formatHeadingCase } from "@/lib/sentence-case";
import { isPanelistVerified } from "@/lib/verification-status";

/** 12-lobe scalloped seal — verified badge shape. */
const SCALLOPED_SEAL_PATH =
  "M12 1.2L14.3 3.4L17.4 2.65L18.29 5.71L21.35 6.6L20.6 9.7L22.8 12L20.6 14.3L21.35 17.4L18.29 18.29L17.4 21.35L14.3 20.6L12 22.8L9.7 20.6L6.6 21.35L5.71 18.29L2.65 17.4L3.4 14.3L1.2 12L3.4 9.7L2.65 6.6L5.71 5.71L6.6 2.65L9.7 3.4L12 1.2Z";

/** Rounded white checkmark centered in the seal. */
const SEAL_CHECKMARK = {
  d: "M8.4 12.4 10.9 14.9 16.2 8.8",
  strokeWidth: 2.15,
} as const;

const BADGE_SIZES = {
  sm: "h-[18px] w-[18px]",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

function ScallopedVerifiedSeal({
  sizeClass,
  title,
  className = "",
  sealStroke,
}: {
  sizeClass: string;
  title: string;
  className?: string;
  sealStroke?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${sizeClass} ${className}`.trim()}
      title={title}
      aria-label={title}
      role="img"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
        <path
          d={SCALLOPED_SEAL_PATH}
          fill="currentColor"
          stroke={sealStroke}
          strokeWidth={sealStroke ? 0.75 : 0}
        />
        <path
          d={SEAL_CHECKMARK.d}
          fill="none"
          stroke="#ffffff"
          strokeWidth={SEAL_CHECKMARK.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function VerifiedCheckBadge({
  size = "md",
  title = "Verified account",
  className = "",
  tone = "emerald",
}: {
  size?: "sm" | "md" | "lg";
  title?: string;
  className?: string;
  /** `emerald` on light UI; `light` adds white outline for dark backgrounds. */
  tone?: "emerald" | "light";
}) {
  return (
    <ScallopedVerifiedSeal
      sizeClass={BADGE_SIZES[size]}
      title={title}
      className={`${tone === "light" ? "text-emerald-400" : "text-emerald-500"} ${className}`.trim()}
      sealStroke={tone === "light" ? "#ffffff" : undefined}
    />
  );
}

/** Pill label with scalloped verified seal aligned to the left edge. */
export function VerifiedStatusPill({
  label = "Verified",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-500/15 py-0.5 pl-0.5 pr-2.5 text-xs font-semibold text-emerald-50 backdrop-blur-sm ${className}`.trim()}
    >
      <VerifiedCheckBadge size="sm" title={formatHeadingCase(label)} />
      <span>{formatHeadingCase(label)}</span>
    </span>
  );
}

export function isAccountApproved(
  verificationStatus: string,
  accountStatus: "active" | "on_hold" = "active"
): boolean {
  return isPanelistVerified(verificationStatus) && accountStatus === "active";
}

export function isAccountVerified(verificationStatus: string): boolean {
  return isPanelistVerified(verificationStatus);
}
