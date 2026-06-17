"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, SelectInput } from "./form-ui";
import {
  MONTH_OPTIONS,
  composeDob,
  daysInMonth,
  getYearOptions,
  isValidDobString,
  parseDobParts,
} from "@/lib/dob";
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
}

function emptyParts(): DobParts {
  return { day: "", month: "", year: "" };
}

export function DateOfBirthPicker({ value, onChange, onBlur, error, compact = false }: DateOfBirthPickerProps) {
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
        <Field label="Month" required id="dob-month">
          <SelectInput
            id="dob-month"
            value={month}
            onChange={(e) => updatePart("month", e.target.value)}
            onBlur={onBlur}
            error={error}
            className={selectClass}
            autoComplete="bday-month"
          >
            <option value="">Month</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Day" required id="dob-day">
          <SelectInput
            id="dob-day"
            value={day}
            onChange={(e) => updatePart("day", e.target.value)}
            onBlur={onBlur}
            error={error}
            className={selectClass}
            autoComplete="bday-day"
          >
            <option value="">Day</option>
            {dayOptions.map((d) => (
              <option key={d} value={String(d)}>
                {d}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="Year" required id="dob-year">
          <SelectInput
            id="dob-year"
            value={year}
            onChange={(e) => updatePart("year", e.target.value)}
            onBlur={onBlur}
            error={error}
            className={selectClass}
            autoComplete="bday-year"
          >
            <option value="">Year</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
        Select your birth month, day, and year. You must be at least 18 years old.
      </p>

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
        />
      ) : null}
    </div>
  );
}

function AgeEligibilityBanner({
  isComplete,
  eligible,
  compact = false,
}: {
  isComplete: boolean;
  eligible: boolean;
  compact?: boolean;
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
        <p className="font-medium text-red-800">Invalid date of birth</p>
        <p className="mt-1 text-red-800">Please select a valid month, day, and year.</p>
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
      <p className="font-medium text-red-800">Age requirement not met</p>
      <p className="mt-1 text-red-800">You must be at least 18 years old to register for the panel.</p>
    </div>
  );
}
