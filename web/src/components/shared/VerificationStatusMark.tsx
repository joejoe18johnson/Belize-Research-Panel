export type VerificationMarkStatus = "approved" | "under_review" | "denied" | "missing";

function MarkGlyph({ status }: { status: VerificationMarkStatus }) {
  if (status === "approved") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d="M3.5 8.2 6.4 11 12.5 4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "denied") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (status === "under_review") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="8" cy="8" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 5.2V8.2l2 1.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M4.5 8h7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const markTone: Record<VerificationMarkStatus, string> = {
  approved: "bg-emerald-600 text-white",
  denied: "bg-red-600 text-white",
  under_review: "bg-amber-500 text-amber-950",
  missing: "bg-zinc-500 text-white",
};

export function VerificationStatusMark({
  status,
  size = "md",
}: {
  status: VerificationMarkStatus;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${markTone[status]} ${sizeClass}`}
      aria-hidden="true"
    >
      <MarkGlyph status={status} />
    </span>
  );
}
