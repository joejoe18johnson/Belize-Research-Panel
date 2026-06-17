"use client";

import type { PasswordStrengthResult } from "@/lib/validation";

const labelStyles: Record<PasswordStrengthResult["label"], string> = {
  Weak: "text-red-600",
  Moderate: "text-orange-600",
  Strong: "text-green-600",
};

const barStyles: Record<PasswordStrengthResult["label"], string> = {
  Weak: "bg-red-500",
  Moderate: "bg-orange-500",
  Strong: "bg-green-500",
};

export function PasswordStrengthBar({ strength }: { strength: PasswordStrengthResult | null }) {
  if (!strength) return null;

  const fillPercent = strength.percent > 0 ? strength.percent : 4;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium">
        <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Password strength</span>
        <span className={labelStyles[strength.label]}>{strength.label}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-200"
        role="progressbar"
        aria-valuenow={strength.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Password strength: ${strength.label}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barStyles[strength.label]}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      {strength.message ? (
        <p className={`mt-1.5 text-sm ${labelStyles[strength.label]}`}>{strength.message}</p>
      ) : null}
      {!strength.meetsRequirement ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
          Password must reach at least moderate strength (orange) before you can continue.
        </p>
      ) : null}
    </div>
  );
}
