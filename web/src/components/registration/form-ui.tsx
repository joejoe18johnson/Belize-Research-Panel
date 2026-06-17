import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { siteCheckboxClass, siteRadioClass } from "@/lib/site-controls";
import type { FeedbackTone } from "@/lib/site-alerts";
import { formatHeadingCase } from "@/lib/sentence-case";

export { siteCheckboxClass, siteRadioClass };

const inputClass =
  "w-full h-12 rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-900 transition hover:bg-zinc-50 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-zinc-50 disabled:text-zinc-500";
export const choiceBoxClass =
  "w-full h-12 appearance-none rounded-lg border border-zinc-200 bg-white bg-none px-4 pr-10 text-sm text-zinc-900 transition hover:bg-zinc-50 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-zinc-50 disabled:text-zinc-500";
export const choiceBoxLabelClass =
  "flex h-12 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 text-sm text-zinc-900 transition hover:bg-zinc-50";
const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500/20";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-800";
const errorClass = "mt-1.5 text-sm text-red-600";
const hintClass = "mt-1.5 text-sm text-zinc-500";

export function FormSection({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-zinc-900">
        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-sm text-white">
          {step}
        </span>
        {formatHeadingCase(title)}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function FieldGroup({ children, columns = 1 }: { children: ReactNode; columns?: 1 | 2 }) {
  return (
    <div className={columns === 2 ? "grid gap-5 md:grid-cols-2" : "space-y-5"}>{children}</div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  id?: string;
}

export function Field({ label, required, error, hint, children, id }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {formatHeadingCase(label)}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
      {error ? <p className={errorClass} role="alert">{error}</p> : null}
      {!error && hint ? <p className={hintClass}>{formatHeadingCase(hint)}</p> : null}
    </div>
  );
}

export function TextInput({
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      className={`${inputClass} ${error ? errorInputClass : ""} ${className}`}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
}

export function SelectInput({
  error,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div className="relative">
      <select
        className={`${choiceBoxClass} ${error ? errorInputClass : ""} ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
      >
        <path
          fillRule="evenodd"
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export function TextArea({
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      className={`${inputClass} min-h-24 resize-y py-3 ${error ? errorInputClass : ""} ${className}`}
      aria-invalid={error ? "true" : undefined}
      {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
    />
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
  error,
  id,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  id: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex items-start gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 transition ${
          disabled ? "cursor-not-allowed bg-zinc-50 text-zinc-500" : "cursor-pointer hover:bg-zinc-50"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className={`${siteCheckboxClass} mt-0.5`}
        />
        <span>{formatHeadingCase(label)}</span>
      </label>
      {error ? <p className={`${errorClass} ml-2 mt-1.5`} role="alert">{error}</p> : null}
    </div>
  );
}

export function MultiSelect({
  options,
  values,
  onChange,
  error,
}: {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}) {
  const toggle = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  };

  return (
    <div>
      <div className={`grid gap-3 sm:grid-cols-2 ${error ? "rounded-lg ring-2 ring-red-500/30 p-2" : ""}`}>
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 transition hover:bg-zinc-50"
          >
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => toggle(option)}
              className={siteCheckboxClass}
            />
            <span>{formatHeadingCase(option)}</span>
          </label>
        ))}
      </div>
      {error ? <p className={errorClass} role="alert">{error}</p> : null}
    </div>
  );
}

export function Alert({
  variant,
  children,
}: {
  variant: FeedbackTone;
  children: ReactNode;
}) {
  return (
    <BrandedAlert tone={variant} showIcon>
      {children}
    </BrandedAlert>
  );
}

export function FileInput({
  accept,
  onChange,
  error,
  optional,
}: {
  accept?: string;
  onChange: (file: File | null) => void;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className={`block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-800 ${error ? "rounded-lg ring-2 ring-red-500/30" : ""}`}
      />
      {optional ? <p className={hintClass}>{formatHeadingCase("Optional")}</p> : null}
      {error ? <p className={errorClass} role="alert">{error}</p> : null}
    </div>
  );
}
