"use client";

import { getRegistrationProgress, type RegistrationProgressInput } from "@/lib/registration-progress";
import { formatHeadingCase } from "@/lib/sentence-case";

export function RegistrationProgress({
  activePhaseIndex,
  ...props
}: RegistrationProgressInput & { activePhaseIndex: number }) {
  const progress = getRegistrationProgress(props, activePhaseIndex);

  return (
    <div
      className="sticky top-14 z-20 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-5 shadow-sm backdrop-blur sm:top-16 sm:px-6 sm:py-4"
      aria-label="Registration progress"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
        <div className="space-y-1.5 sm:space-y-1">
          <p className="text-xs font-semibold tracking-wide text-teal-700">
            Step {progress.currentIndex + 1} of {progress.totalPhases}
          </p>
          <p className="text-sm font-semibold text-zinc-900">{formatHeadingCase(progress.currentPhase.label)}</p>
          <p className="text-xs leading-relaxed text-zinc-500">{formatHeadingCase(progress.currentPhase.description)}</p>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-zinc-100 sm:mb-4">
        <div
          className="h-full rounded-full bg-teal-700 transition-all duration-500 ease-out"
          style={{ width: `${progress.percent}%` }}
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Registration ${progress.percent}% complete`}
        />
      </div>

      <ol className="flex items-center justify-between gap-1 sm:grid sm:grid-cols-6 sm:gap-2" aria-label="Registration steps">
        {progress.phases.map((phase, index) => (
          <li key={phase.id} className="flex flex-col items-center text-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors sm:h-8 sm:w-8 ${
                phase.status === "complete"
                  ? "border-teal-700 bg-teal-700 text-white"
                  : phase.status === "current"
                    ? "border-teal-700 bg-teal-50 text-teal-800 ring-2 ring-teal-300/60"
                    : "border-zinc-200 bg-white text-zinc-400"
              }`}
              aria-current={phase.status === "current" ? "step" : undefined}
            >
              {phase.status === "complete" ? (
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3.25-3.25a1 1 0 1 1 1.414-1.414l2.543 2.543 6.543-6.543a1 1 0 0 1 1.412 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`mt-2 hidden text-[11px] leading-tight font-medium sm:block ${
                phase.status === "current"
                  ? "text-teal-800"
                  : phase.status === "complete"
                    ? "text-zinc-700"
                    : "text-zinc-400"
              }`}
            >
              {formatHeadingCase(phase.label)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
