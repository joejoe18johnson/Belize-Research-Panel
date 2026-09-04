"use client";

import { getRegistrationProgress, type RegistrationProgressInput } from "@/lib/registration-progress";
import { formatSentenceCase } from "@/lib/sentence-case";

export function RegistrationProgress({
  activePhaseIndex,
  furthestPhaseIndex,
  onSelectPhase,
  ...props
}: RegistrationProgressInput & {
  activePhaseIndex: number;
  furthestPhaseIndex: number;
  onSelectPhase: (index: number) => void;
}) {
  const progress = getRegistrationProgress(props, activePhaseIndex);
  const reachableIndex = Math.max(activePhaseIndex, furthestPhaseIndex);

  return (
    <div
      className="sticky top-14 z-20 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 px-4 py-5 shadow-sm backdrop-blur sm:top-16 sm:px-6 sm:py-4"
      aria-label="Registration progress"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
        <div className="space-y-1.5 sm:space-y-1">
          <p className="text-xs font-semibold tracking-wide text-teal-700">
            Step {progress.currentIndex + 1} of {progress.totalPhases}
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatSentenceCase(progress.currentPhase.label)}</p>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatSentenceCase(progress.currentPhase.description)}</p>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 sm:mb-4">
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

      <ol className="flex items-center justify-between gap-1 lg:grid lg:grid-cols-6 lg:gap-2" aria-label="Registration steps">
        {progress.phases.map((phase, index) => {
          const reachable = index <= reachableIndex;
          const isCurrent = phase.status === "current";
          const stepLabel = `Step ${index + 1}: ${formatSentenceCase(phase.label)}`;

          return (
            <li key={phase.id} className="flex flex-col items-center text-center">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => {
                  if (reachable && !isCurrent) onSelectPhase(index);
                }}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={
                  isCurrent
                    ? `${stepLabel} (current)`
                    : reachable
                      ? `Go to ${stepLabel}`
                      : `${stepLabel} (not available yet)`
                }
                title={reachable ? (isCurrent ? `${stepLabel} (current)` : `Go to ${stepLabel}`) : "Complete the earlier steps first"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition ${
                  phase.status === "complete"
                    ? "cursor-pointer border-teal-700 bg-teal-700 text-white hover:bg-teal-800"
                    : isCurrent
                      ? "border-teal-700 bg-teal-50 text-teal-800 ring-2 ring-teal-300/60 dark:text-teal-200"
                      : reachable
                        ? "cursor-pointer border-teal-600 bg-white text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:bg-zinc-900 dark:text-teal-200 dark:hover:bg-teal-950"
                        : "cursor-not-allowed border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                }`}
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
              </button>
              <span
                className={`mt-2 hidden text-[11px] leading-tight font-medium lg:block ${
                  isCurrent
                    ? "text-teal-800 dark:text-teal-200"
                    : phase.status === "complete" || reachable
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {formatSentenceCase(phase.label)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
