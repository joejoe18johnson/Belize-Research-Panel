"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { siteSelectTriggerClass, siteSelectTriggerCompactClass } from "@/lib/site-controls";

export type SiteSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 text-zinc-500 transition ${open ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 0 1.42l-7.25 7.25a1 1 0 0 1-1.42 0l-3.25-3.25a1 1 0 1 1 1.42-1.42l2.54 2.54 6.54-6.54a1 1 0 0 1 1.42 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function optionsFromSelectChildren(children: ReactNode): SiteSelectOption[] {
  const options: SiteSelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;
    const props = child.props as {
      value?: string | number;
      children?: ReactNode;
      disabled?: boolean;
    };
    options.push({
      value: String(props.value ?? ""),
      label: String(props.children ?? ""),
      disabled: props.disabled,
    });
  });

  return options;
}

export function mapStringOptions(values: readonly string[], emptyLabel = "—"): SiteSelectOption[] {
  return values.map((value) => ({
    value,
    label: value || emptyLabel,
  }));
}

export function SiteSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  id,
  "aria-label": ariaLabel,
  compact = false,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SiteSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  compact?: boolean;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const display = selected?.label ?? placeholder;
  const isPlaceholder = !selected;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerClass = `${compact ? siteSelectTriggerCompactClass : siteSelectTriggerClass} ${
    error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
  }`;

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={triggerClass}
      >
        <span className={`truncate ${isPlaceholder ? "text-zinc-500" : "text-zinc-900"}`}>{display}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-teal-100 bg-white py-1 shadow-lg shadow-teal-950/10"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={`${option.value}::${option.label}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-teal-700 text-white"
                      : "text-zinc-800 hover:bg-teal-50 hover:text-teal-900"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {active ? <CheckIcon /> : <span className="w-4 shrink-0" aria-hidden />}
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function SiteSelectField({
  error,
  className = "",
  children,
  value,
  onChange,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
  error?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = optionsFromSelectChildren(children);

  return (
    <SiteSelect
      {...props}
      value={value}
      onChange={onChange}
      options={options}
      className={className}
      error={Boolean(error)}
    />
  );
}
