"use client";

import type { SurveyAnswerValue, SurveyQuestion, SurveyQuestionType } from "@/lib/survey-types";
import { SURVEY_QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import { formatHeadingCase } from "@/lib/sentence-case";
import { SiteSelect, mapStringOptions } from "@/components/shared/SiteSelect";

export function SurveyQuestionField({
  question,
  value,
  onChange,
  disabled = false,
  invalid = false,
}: {
  question: SurveyQuestion;
  value: SurveyAnswerValue | undefined;
  onChange: (value: SurveyAnswerValue) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const fieldId = `survey-field-${question.id}`;
  const describedBy = invalid ? `survey-error-${question.id}` : undefined;
  const inputClass = `mt-2 w-full rounded-xl border px-3 py-2.5 text-sm ${
    invalid
      ? "border-red-500 bg-red-50/60 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
      : "border-zinc-200 dark:border-zinc-800"
  }`;
  const choiceClass = `flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-teal-50/40 ${
    invalid ? "border-red-300 bg-red-50/40" : "border-zinc-200 dark:border-zinc-800"
  }`;

  if (question.type === "short_text") {
    return (
      <input
        id={fieldId}
        type="text"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    );
  }

  if (question.type === "long_text") {
    return (
      <textarea
        id={fieldId}
        rows={4}
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    );
  }

  if (question.type === "rating_scale") {
    const selected = typeof value === "number" ? value : null;
    const min = question.scaleMin;
    const max = question.scaleMax;
    const options = Array.from({ length: max - min + 1 }, (_, index) => min + index);

    return (
      <div
        id={fieldId}
        className="mt-3 space-y-3"
        role="group"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        tabIndex={invalid ? -1 : undefined}
      >
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`min-h-10 min-w-10 rounded-full border px-3 text-sm font-semibold transition ${
                selected === option
                  ? "border-teal-600 bg-teal-700 text-white"
                  : invalid
                    ? "border-red-400 bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-teal-300 dark:hover:border-teal-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
          <span>{question.scaleMinLabel}</span>
          <span>{question.scaleMaxLabel}</span>
        </div>
      </div>
    );
  }

  if (question.type === "dropdown") {
    return (
      <SiteSelect
        id={fieldId}
        value={typeof value === "string" ? value : ""}
        onChange={(next) => onChange(next)}
        placeholder="Select an option"
        disabled={disabled}
        error={invalid}
        options={[
          { value: "", label: "Select an option" },
          ...mapStringOptions(question.options),
        ]}
        className="mt-2"
      />
    );
  }

  if (question.type === "multiple_choice") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div
        id={fieldId}
        className="mt-3 space-y-2"
        role="group"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        tabIndex={invalid ? -1 : undefined}
      >
        {question.options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label key={option} className={choiceClass}>
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  onChange(checked ? selected.filter((item) => item !== option) : [...selected, option]);
                }}
                className="h-4 w-4 rounded border-zinc-300 text-teal-700"
              />
              <span className="text-sm text-zinc-800 dark:text-zinc-200">{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  const options = question.type === "yes_no" ? ["Yes", "No"] : question.options;
  const selected = typeof value === "string" ? value : "";

  return (
    <div
      id={fieldId}
      className="mt-3 space-y-2"
      role="radiogroup"
      aria-invalid={invalid}
      aria-describedby={describedBy}
      tabIndex={invalid ? -1 : undefined}
    >
      {options.map((option) => (
        <label key={option} className={choiceClass}>
          <input
            type="radio"
            name={question.id}
            checked={selected === option}
            disabled={disabled}
            onChange={() => onChange(option)}
            className="h-4 w-4 border-zinc-300 text-teal-700"
          />
          <span className="text-sm text-zinc-800 dark:text-zinc-200">{option}</span>
        </label>
      ))}
    </div>
  );
}

export function SurveyQuestionPreviewLabel({
  question,
  index,
}: {
  question: SurveyQuestion;
  index: number;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {index + 1}. {question.title || "Untitled question"}
        {question.required ? <span className="text-red-600"> *</span> : null}
      </p>
      {question.description ? <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{question.description}</p> : null}
      <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {formatHeadingCase(SURVEY_QUESTION_TYPE_LABELS[question.type])}
      </p>
    </div>
  );
}

export const BUILDER_QUESTION_TYPES = Object.keys(SURVEY_QUESTION_TYPE_LABELS) as SurveyQuestionType[];
