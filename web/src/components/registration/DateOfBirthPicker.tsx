"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, SelectInput } from "./form-ui";
import { useSignupCopy, useLocale } from "@/components/locale/LocaleProvider";
import {
  composeDob,
  daysInMonth,
  getYearOptions,
  isValidDobString,
  parseDobParts,
} from "@/lib/dob";
import { monthOptionsForLocale } from "@/lib/signup-locale";
import { meetsMinimumAge } from "@/lib/validation";

interface DobParts {
  day: string;
  month: string;
  year: string;
}

interface DateOfBirthPickerProps {
  value: string;
  onChange: (dob: string) => void;
  onBlur?: () => void;
  error?: string;
  compact?: boolean;
  minAgeHint?: string;
}

function emptyParts(): DobParts {
  return { day: "", month: "", year: "" };
}

export function DateOfBirthPicker({
  value,
  onChange,
  onBlur,
  error,
  compact = false,
  minAgeHint,
}: DateOfBirthPickerProps) {
  const copy = useSignupCopy();
  const locale = useLocale();
  const hint = minAgeHint ?? copy.dobMinAgeHint;
  const monthOptions = useMemo(() => monthOptionsForLocale(locale), [locale]);
  const [parts, setParts] = useState<DobParts>(() =>
    value ? parseDobParts(value) : emptyParts()
  );

  useEffect(() => {
    if (value) {
      setParts(parseDobParts(value));
    }
  }, [value]);

  const { day, month, year } = parts;
  const yearOptions = useMemo(() => getYearOptions(), []);

  const dayOptions = useMemo(() => {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || 1;
    const max = daysInMonth(m, y);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [year, month]);

  const updatePart = (part: keyof DobParts, nextValue: string) => {
    const next: DobParts = {
      ...parts,
      [part]: nextValue,
    };

    if (next.day && next.month && next.year) {
      const y = parseInt(next.year, 10);
      const m = parseInt(next.month, 10);
      const maxDay = daysInMonth(m, y);
      if (parseInt(next.day, 10) > maxDay) {
        next.day = String(maxDay);
      }
    }

    setParts(next);
    onChange(composeDob(next.year, next.month, next.day));
  };

  const selectClass = error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "";

  const composedDob = composeDob(year, month, day);
  const hasAllParts = Boolean(day && month && year);
  const isComplete = hasAllParts && Boolean(composedDob) && isValidDobString(composedDob);
  const eligible = isComplete && meetsMinimumAge(composedDob);

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Field label={copy.dobMonthLabel} required id="dob-month">
          <SelectInput
            id="dob-month"
            value={month}
            onChange={(e) => updatePart("month", e.target.value)}
            onBlur={onBlur}
            error={error}
            className={selectClass}
            autoComplete="bday-month"
          >
            <option value="">{copy.dobMonthPlaceholder}</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={copy.dobDayLabel} required id="dob-day">
          <SelectInput
            id="dob-day"
            value={day}
            onChange={(e) => updatePart("day", e.target.value)}
            onBlur={onBlur}
            error={error}
            className={selectClass}
            autoComplete="bday-day"
          >
            <option value="">{copy.dobDayPlaceholder}</option>
            {dayOptions.map((d) => (
              <option key={d} value={String(d)}>
                {d}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label={copy.dobYearLabel} required id="dob-year">
          <SelectInput
            id="dob-year"
            value={year}
            onChange={(e) => updatePart("year", e.target.value)}
            onBlur={onBlur}
            error={error}
            className={selectClass}
            autoComplete="bday-year"
          >
            <option value="">{copy.dobYearPlaceholder}</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {hasAllParts ? (
        <AgeEligibilityBanner
          isComplete={isComplete}
          eligible={eligible}
          compact={compact}
          copy={copy}
        />
      ) : null}
    </div>
  );
}

function AgeEligibilityBanner({
  isComplete,
  eligible,
  compact = false,
  copy,
}: {
  isComplete: boolean;
  eligible: boolean;
  compact?: boolean;
  copy: ReturnType<typeof useSignupCopy>;
}) {
  const boxClass = compact
    ? "mt-3 rounded-lg border px-4 py-3 text-sm"
    : "mt-4 rounded-xl border px-4 py-3 text-sm";

  if (!isComplete) {
    return (
      <div
        className={`${boxClass} border-red-200 bg-red-50 text-red-900`}
        role="alert"
        aria-live="polite"
      >
        <p className="font-medium text-red-800">{copy.invalidDobTitle}</p>
        <p className="mt-1 text-red-800">{copy.invalidDobBody}</p>
      </div>
    );
  }

  if (eligible) {
    return null;
  }

  return (
    <div
      className={`${boxClass} border-red-200 bg-red-50 text-red-900`}
      role="alert"
      aria-live="polite"
    >
      <p className="font-medium text-red-800">{copy.ageRequirementTitle}</p>
      <p className="mt-1 text-red-800">{copy.ageRequirementBody}</p>
    </div>
  );
}
