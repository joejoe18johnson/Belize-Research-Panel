"use client";

import Link from "next/link";

const navButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed sm:w-auto";

export function RegistrationPhaseNav({
  activePhaseIndex,
  isLastPhase,
  submitting,
  nextDisabled,
  showReturnHome,
  onBack,
  onNext,
}: {
  activePhaseIndex: number;
  isLastPhase: boolean;
  submitting?: boolean;
  nextDisabled?: boolean;
  showReturnHome?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {activePhaseIndex > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className={`${navButtonClass} border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50`}
        >
          Back
        </button>
      ) : (
        <span className="hidden sm:block" aria-hidden="true" />
      )}

      {showReturnHome ? (
        <Link
          href="/"
          className={`${navButtonClass} bg-teal-700 text-white shadow-sm hover:bg-teal-800`}
        >
          Return home
        </Link>
      ) : isLastPhase ? (
        <button
          type="submit"
          disabled={submitting}
          className={`${navButtonClass} bg-teal-700 text-white shadow-sm hover:bg-teal-800 disabled:opacity-60`}
        >
          {submitting ? "Submitting..." : "Submit registration"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={`${navButtonClass} bg-teal-700 text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none disabled:hover:bg-zinc-300`}
        >
          Next
        </button>
      )}
    </div>
  );
}
