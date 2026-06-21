import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { SiteSelectField } from "@/components/shared/SiteSelect";
import { siteCheckboxClass, siteRadioClass } from "@/lib/site-controls";
import type { FeedbackTone } from "@/lib/site-alerts";
import { formatHeadingCase } from "@/lib/sentence-case";

export { siteCheckboxClass, siteRadioClass };

const inputClass =
  "w-full h-12 rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-900 transition hover:bg-zinc-50 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:border-teal-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";
export const choiceBoxClass =
  "w-full h-12 appearance-none rounded-lg border border-zinc-200 bg-white bg-none px-4 pr-10 text-sm text-zinc-900 transition hover:bg-zinc-50 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-zinc-50 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:border-teal-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500";
export const choiceBoxLabelClass =
  "flex h-12 cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 text-sm text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800";
const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500/20";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200";
const errorClass = "mt-1.5 text-sm text-red-600 dark:text-red-400";
const hintClass = "mt-1.5 text-sm text-zinc-500 dark:text-zinc-400";

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
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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
      {error ? <p className={errorClass} role="alert">{formatHeadingCase(error)}</p> : null}
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
  value,
  onChange,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
}) {
  return (
    <SiteSelectField
      {...props}
      value={value}
      onChange={(next) => onChange({ target: { value: next } })}
      className={className}
      error={error}
    >
      {children}
    </SiteSelectField>
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
        className={`flex items-start gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-800 transition dark:border-zinc-700 dark:text-zinc-200 ${
          disabled
            ? "cursor-not-allowed bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-500"
            : `cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 ${checked ? "border-teal-600 bg-teal-50/50 dark:border-teal-600 dark:bg-teal-950/30" : ""}`
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
      {error ? <p className={`${errorClass} ml-2 mt-1.5`} role="alert">{formatHeadingCase(error)}</p> : null}
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
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 ${
              values.includes(option) ? "border-teal-600 bg-teal-50/50 dark:border-teal-600 dark:bg-teal-950/30" : ""
            }`}
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
      {error ? <p className={errorClass} role="alert">{formatHeadingCase(error)}</p> : null}
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
      {error ? <p className={errorClass} role="alert">{formatHeadingCase(error)}</p> : null}
    </div>
  );
}
