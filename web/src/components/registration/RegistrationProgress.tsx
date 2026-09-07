"use client";

import { getRegistrationProgress, type RegistrationProgressInput } from "@/lib/registration-progress";
import { useRegistrationCopy } from "@/components/locale/LocaleProvider";

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
  const copy = useRegistrationCopy();
  const progress = getRegistrationProgress(props, activePhaseIndex);
  const reachableIndex = Math.max(activePhaseIndex, furthestPhaseIndex);
  const localizedPhases = copy.phases;
  const currentPhase = localizedPhases[progress.currentIndex] ?? localizedPhases[0];

  return (
    <div
      id="registration-progress"
      data-sticky-chrome="progress"
      className="sticky z-20 scroll-mt-[calc(var(--brp-header-height, 4.75rem)+0.5rem)] rounded-2xl border border-zinc-200 bg-white/95 px-4 py-5 shadow-sm backdrop-blur outline-none dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-6 sm:py-4"
      style={{ top: "calc(var(--brp-header-height, 4.75rem) + 0.5rem)" }}
      aria-label={copy.progressAria}
      tabIndex={-1}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
        <div className="space-y-1.5 sm:space-y-1">
          <p className="text-xs font-semibold tracking-wide text-teal-700">
            {copy.stepOf(progress.currentIndex + 1, progress.totalPhases)}
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{currentPhase.label}</p>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            {currentPhase.description}
          </p>
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
          aria-label={copy.percentAria(progress.percent)}
        />
      </div>

      <ol className="flex items-center justify-between gap-1 lg:grid lg:grid-cols-6 lg:gap-2" aria-label={copy.stepsAria}>
        {progress.phases.map((phase, index) => {
          const reachable = index <= reachableIndex;
          const isCurrent = phase.status === "current";
          const label = localizedPhases[index]?.label ?? phase.label;
          const ariaStep = `${index + 1}. ${label}`;

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
                    ? copy.currentStep(ariaStep)
                    : reachable
                      ? copy.goToStep(ariaStep)
                      : `${ariaStep} (${copy.stepUnavailable})`
                }
                title={reachable ? (isCurrent ? copy.currentStep(ariaStep) : copy.goToStep(ariaStep)) : copy.stepUnavailable}
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
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              <span
                className={`mt-2 hidden text-[11px] font-medium leading-tight lg:block ${
                  isCurrent ? "text-teal-800 dark:text-teal-200" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
